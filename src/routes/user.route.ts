import { AppEnv } from "@/context";
import {
	readPostFromAuthor,
	findPostsFromAuthor,
	findProfile,
	updateProfile,
} from "@/database/queries";
import { valibot } from "@/middlewares";
import { PageQuerySchema } from "@/schemas";
import { UpdateProfileSchema } from "@/schemas/user.schema";
import { Hono } from "hono";
import { User } from "lucia";

const userRoutes = new Hono<AppEnv>();

// Get the user's profile
userRoutes.get("/:username/profile", async (c) => {
	const username = c.req.param("username");

	const profile = await findProfile(c.get("db"), username);

	if (!profile) {
		return c.json({ state: "success", message: "User not found" }, 404);
	}

	return c.json({
		state: "success",
		message: "User fetched successfully",
		output: profile,
	});
});

// Get the user's posts
userRoutes.get(
	"/:username/posts",
	valibot("query", PageQuerySchema),
	async (c) => {
		const username = c.req.param("username");
		const pageQuery = c.req.valid("query");

		const data = await findPostsFromAuthor(c.get("db"), username, pageQuery);

		if (!data.length) {
			return c.json({ state: "success", message: "No posts found" }, 404);
		}

		return c.json({
			state: "success",
			message: "Posts fetched successfully",
			output: data,
		});
	}
);

// Read post from an author
userRoutes.get("/:username/posts/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const bucket = c.env.POSTS_BUCKET;

	const data = await readPostFromAuthor(c.get("db"), id, authorId);

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

// Update user profile
userRoutes.patch(
	"/profile",
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

export default userRoutes;
