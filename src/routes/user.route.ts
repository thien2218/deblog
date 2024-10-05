import { AppEnv } from "@/context";
import {
	readPostFromAuthor,
	findPostsFromAuthor,
	findProfile,
	updateProfile,
	checkResourceExists,
	sendReport,
	subscribeToUser,
	findSeries,
} from "@/database/queries";
import { auth, valibot } from "@/middlewares";
import {
	PageQuerySchema,
	SendReportSchema,
	UpdateProfileSchema,
} from "@/schemas";
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
	const username = c.req.param("username");
	const id = c.req.param("id");
	const bucket = c.env.POSTS_BUCKET;

	const data = await readPostFromAuthor(c.get("db"), id, username);

	if (!data) {
		return c.json({ state: "success", message: "Post not found" }, 404);
	}

	const obj = await bucket.get(`${data.author.id}/${id}`);

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

// Report resource violation
userRoutes.post(
	"/report",
	auth,
	valibot("json", SendReportSchema),
	async (c) => {
		const { id } = c.get("user");
		const payload = c.req.valid("json");
		const db = c.get("db");

		const { exists } = await checkResourceExists(
			db,
			payload.resourceType,
			payload.reported
		);

		if (!exists) {
			return c.text("Reported resource not found", 404);
		}

		await sendReport(db, id, payload);

		return c.text("Report sent successfully");
	}
);

// Subscribe to another user
userRoutes.post("/:username/subscribe", auth, async (c) => {
	const user = c.get("user");
	const username = c.req.param("username");

	if (username === user.username) {
		return c.text("You can't subscribe to yourself", 400);
	}

	await subscribeToUser(c.get("db"), user.id, username);

	return c.text("User subscribed successfully");
});

// Get series of a user
userRoutes.get("/:username/series", async (c) => {
	const username = c.req.param("username");

	const series = await findSeries(c.get("db"), username);

	if (!series.length) {
		return c.json({ state: "success", message: "No series found" }, 404);
	}

	return c.json({
		state: "success",
		message: "Series fetched successfully",
		output: series,
	});
});

export default userRoutes;
