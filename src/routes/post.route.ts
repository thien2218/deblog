import { AppEnv } from "@/context";
import {
	deletePost,
	savePost,
	findExistsPost,
	findPosts,
	findSavedPosts,
	updatePostMetadata,
} from "@/database/queries";
import { auth, valibot } from "@/middlewares";
import {
	PageQuerySchema,
	UpdatePostContentSchema,
	UpdatePostMetadataSchema,
} from "@/schemas";
import { Hono } from "hono";
import { User } from "lucia";

const postRoutes = new Hono<AppEnv>().basePath("/posts");

// Get many posts
postRoutes.get("/", valibot("query", PageQuerySchema), async (c) => {
	const pageQuery = c.req.valid("query");

	const data = await findPosts(c.get("db"), pageQuery);

	if (!data.length) {
		return c.json({ message: "No blog posts found", state: "success" }, 404);
	}

	return c.json({
		message: "Blog posts fetched successfully",
		state: "success",
		output: data,
	});
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

// Get saved posts of a user
postRoutes.get("/saved", auth, valibot("query", PageQuerySchema), async (c) => {
	const { id: userId, email, ...author } = c.get("user");
	const pageQuery = c.req.valid("query");

	const posts = await findSavedPosts(c.get("db"), userId, pageQuery);

	if (!posts.length) {
		return c.json({ state: "success", message: "No saved posts found" }, 404);
	}

	return c.json({
		state: "success",
		message: "Saved posts fetched successfully",
		output: posts.map((post) => ({ post, author })),
	});
});

// Update a post metadata
postRoutes.put(
	"/:id/metadata",
	valibot("json", UpdatePostMetadataSchema),
	async (c) => {
		const id = c.req.param("id");
		const { id: authorId } = c.get("user") as User;
		const payload = c.req.valid("json");

		const { meta } = await updatePostMetadata(
			c.get("db"),
			id,
			authorId,
			payload
		);

		if (!meta.rows_written) {
			return c.text("No post from this author with the given post id", 404);
		}

		return c.text("Blog post updated successfully");
	}
);

// Update a post/draft content
postRoutes.put(
	"/:id/content",
	valibot("json", UpdatePostContentSchema),
	async (c) => {
		const id = c.req.param("id");
		const { id: authorId } = c.get("user") as User;
		const bucket = c.env.POSTS_BUCKET;
		const { content } = await c.req.valid("json");

		const { exists } = await findExistsPost(c.get("db"), id, authorId);

		if (!exists) {
			return c.text("No post/draft found with the given id", 404);
		}

		// Check if the post exists in the bucket
		try {
			await bucket.head(`${authorId}/${id}`);
		} catch (error) {
			console.log(error);
			return c.text("No post/draft found in the bucket", 404);
		}

		await bucket.put(`${authorId}/${id}`, content);

		return c.text("Blog post content updated successfully");
	}
);

// Delete a post
postRoutes.delete("/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const bucket = c.env.POSTS_BUCKET;

	const data = await deletePost(c.get("db"), id, authorId);

	if (!data) {
		return c.text(
			"No post found from this author with the given post id",
			404
		);
	}

	await bucket.delete(`${authorId}/${id}`);

	const type = data.isPublished ? "Blog post" : "Draft";

	return c.text(`${type} deleted successfully`);
});

// Add tags to a post
postRoutes.post("/:id/tags");

// Remove tags from a post
postRoutes.delete("/:id/tags");

export default postRoutes;
