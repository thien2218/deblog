import { AppEnv } from "@/context";
import { insertDraft, savePost, selectPosts } from "@/database/queries";
import { auth, valibot } from "@/middlewares";
import { PageQuerySchema } from "@/schemas";
import { Hono } from "hono";
import { nanoid } from "nanoid";

const postRoutes = new Hono<AppEnv>().basePath("/posts");

// Get many posts
postRoutes.get("/", valibot("query", PageQuerySchema), async (c) => {
	const pageQuery = c.req.valid("query");

	const data = await selectPosts(c.get("db"), pageQuery);

	if (!data.length) {
		return c.json({ message: "No blog posts found", state: "success" }, 404);
	}

	return c.json({
		message: "Blog posts fetched successfully",
		state: "success",
		output: data,
	});
});

// Create a draft and get its id
postRoutes.post("/draft", auth, async (c) => {
	const id = nanoid(25);
	const { id: authorId } = c.get("user");
	const bucket = c.env.POSTS_BUCKET;

	await insertDraft(c.get("db"), id, authorId);
	await bucket.put(`${authorId}/${id}`, "");

	return c.json(
		{
			state: "success",
			message: "Draft created successfully",
			output: { id },
		},
		201
	);
});

// Save a post
postRoutes.post("/:id/save", auth, async (c) => {
	const { id: userId } = c.get("user");
	const postId = c.req.param("id");

	await savePost(c.get("db"), postId, userId);

	return c.json({
		message: "Post saved successfully",
		state: "success",
	});
});

export default postRoutes;
