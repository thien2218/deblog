import { AppEnv } from "@/context";
import {
	deletePost,
	insertDraft,
	publishPost,
	savePost,
	selectDraftFromAuthor,
	selectDraftsFromUser,
	selectExistsPost,
	selectPosts,
	selectSavedPostsFromUser,
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
import { nanoid } from "nanoid";

const postRoutes = new Hono<AppEnv>().basePath("/posts");

postRoutes.use("/drafts/*", auth);

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
postRoutes.get(
	"/posts/saved",
	auth,
	valibot("query", PageQuerySchema),
	async (c) => {
		const { id: userId, email, ...author } = c.get("user");
		const pageQuery = c.req.valid("query");

		const posts = await selectSavedPostsFromUser(
			c.get("db"),
			userId,
			pageQuery
		);

		if (!posts.length) {
			return c.json(
				{ state: "success", message: "No saved posts found" },
				404
			);
		}

		return c.json({
			state: "success",
			message: "Saved posts fetched successfully",
			output: posts.map((post) => ({ post, author })),
		});
	}
);

// Update a post/draft metadata
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
			return c.text(
				"No post/draft from this author with the given post id",
				404
			);
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
		const { content } = c.req.valid("json");
		const bucket = c.env.POSTS_BUCKET;

		const existsInDB = await selectExistsPost(c.get("db"), id, authorId);

		if (!existsInDB) {
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

// Delete a post/draft
postRoutes.delete("/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const bucket = c.env.POSTS_BUCKET;

	const data = await deletePost(c.get("db"), id, authorId);

	if (!data) {
		return c.text(
			"No post/draft found from this author with the given post id",
			404
		);
	}

	await bucket.delete(`${authorId}/${id}`);

	const type = data.isPublished ? "Blog post" : "Draft";

	return c.text(`${type} deleted successfully`);
});

// Get many drafts of a user
postRoutes.get("/drafts", valibot("query", PageQuerySchema), async (c) => {
	const { id: authorId, email, ...author } = c.get("user") as User;
	const pageQuery = c.req.valid("query");

	const posts = await selectDraftsFromUser(c.get("db"), authorId, pageQuery);

	if (!posts.length) {
		return c.json({ state: "success", message: "No drafts found" }, 404);
	}

	return c.json({
		state: "success",
		message: "Drafts fetched successfully",
		output: posts.map((post) => ({ post, author })),
	});
});

// Create a draft and get its id
postRoutes.post("/drafts", async (c) => {
	const id = nanoid(25);
	const { id: authorId } = c.get("user") as User;
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

// Read a draft
postRoutes.get("/drafts/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const bucket = c.env.POSTS_BUCKET;

	const post = await selectDraftFromAuthor(c.get("db"), id, authorId);

	if (!post) {
		return c.json({ state: "success", message: "Draft not found" }, 404);
	}

	const obj = await bucket.get(`${authorId}/${id}`);

	if (!obj) {
		return c.text("No draft found in the bucket", 404);
	}

	const content = await obj.text();

	return c.json({
		state: "success",
		message: "Draft fetched successfully",
		output: { ...post, content },
	});
});

// Publish a post
postRoutes.post("/drafts/:id/publish", async (c) => {
	const id = c.req.param("id");
	const { id: authorId } = c.get("user") as User;
	const bucket = c.env.POSTS_BUCKET;

	const obj = await bucket.get(`${authorId}/${id}`);

	if (!obj) {
		return c.text("No draft found in the bucket", 404);
	}

	const content = await obj.text();

	if (content.length < 1000) {
		return c.text("Post content is too short to be published", 400);
	}

	const { meta } = await publishPost(c.get("db"), id, authorId);

	if (!meta.rows_written) {
		return c.text("No draft found with the given id", 404);
	}

	return c.text("Blog post published successfully");
});

export default postRoutes;
