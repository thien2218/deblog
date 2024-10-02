import { AppEnv } from "@/context";
import {
	readPost,
	selectPostsFromAuthor,
	selectProfile,
	updateProfile,
} from "@/database/queries";
import { valibot } from "@/middlewares";
import { PageQuerySchema } from "@/schemas";
import { UpdateProfileSchema } from "@/schemas/user.schema";
import { Hono, MiddlewareHandler } from "hono";
import { User } from "lucia";

const isAuthorized: MiddlewareHandler<AppEnv> = async (c, next) => {
	const username = c.req.param("username");
	const authUser = c.get("user");

	if (username !== authUser?.username) {
		return c.json(
			{
				state: "error",
				message: "You are not authorized to perform this action",
			},
			403
		);
	}

	return next();
};

const userRoutes = new Hono<AppEnv>().basePath("/:username");

// Get the user's profile
userRoutes.get("/profile", async (c) => {
	const username = c.req.param("username");

	const profile = await selectProfile(c.get("db"), username);

	if (!profile) {
		return c.json({ state: "success", message: "User not found" }, 404);
	}

	return c.json({
		state: "success",
		message: "User fetched successfully",
		output: profile,
	});
});

// Update user profile
userRoutes.patch(
	"/profile",
	isAuthorized,
	valibot("json", UpdateProfileSchema),
	async (c) => {
		const { id: userId } = c.get("user") as User;
		const payload = c.req.valid("json");

		const { meta } = await updateProfile(c.get("db"), userId, payload);

		if (!meta.rows_written) {
			return c.text("User not found", 404);
		}

		return c.text("User profile updated successfully");
	}
);

// Get the user's posts
userRoutes.get("/posts", valibot("query", PageQuerySchema), async (c) => {
	const username = c.req.param("username");
	const pageQuery = c.req.valid("query");

	const data = await selectPostsFromAuthor(c.get("db"), username, pageQuery);

	if (!data.length) {
		return c.json({ state: "success", message: "No posts found" }, 404);
	}

	return c.json({
		state: "success",
		message: "Posts fetched successfully",
		output: data,
	});
});

// Read post from an author
userRoutes.get("/posts/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const bucket = c.env.POSTS_BUCKET;

	const data = await readPost(c.get("db"), id, authorId);

	if (!data) {
		return c.json({ state: "success", message: "Post not found" }, 404);
	}

	const obj = await bucket.get(`${authorId}/${id}`);

	if (!obj) {
		return c.text("No post found in the bucket", 404);
	}

	const content = await obj.text();

	return c.json({
		state: "success",
		message: "Post fetched successfully",
		output: { ...data, content },
	});
});

export default userRoutes;
