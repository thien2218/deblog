import { AppEnv } from "@/context";
import {
	readPost,
	selectPostsFromAuthor,
	selectProfile,
	selectSavedPostsFromUser,
	updateProfile,
	updatePostMetadata,
	selectExistsPost,
	deletePost,
	selectDraftsFromUser,
	selectDraftFromAuthor,
	publishPost,
} from "@/database/queries";
import { auth, valibot } from "@/middlewares";
import {
	PageQuerySchema,
	UpdatePostContentSchema,
	UpdatePostMetadataSchema,
} from "@/schemas";
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

userRoutes.use("/drafts/*", auth, isAuthorized);
userRoutes.put("*", isAuthorized);
userRoutes.patch("*", isAuthorized);
userRoutes.delete("*", isAuthorized);

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
	valibot("json", UpdateProfileSchema),
	async (c) => {
		const { id: userId } = c.get("user") as User;
		const payload = c.req.valid("json");

		const { meta } = await updateProfile(c.get("db"), userId, payload);

		if (!meta.rows_updated) {
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

// Get saved posts of a user
userRoutes.get(
	"/posts/saved",
	auth,
	isAuthorized,
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
userRoutes.put(
	"/write-ups/:id/metadata",
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
				403
			);
		}

		return c.text("Blog post updated successfully");
	}
);

// Update a post/draft content
userRoutes.put(
	"/write-ups/:id/content",
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
userRoutes.delete("/write-ups/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const bucket = c.env.POSTS_BUCKET;

	const data = await deletePost(c.get("db"), id, authorId);

	if (!data) {
		return c.text(
			"No post/draft found from this author with the given post id",
			403
		);
	}

	await bucket.delete(`${authorId}/${id}`);

	const type = data.isPublished ? "Blog post" : "Draft";

	return c.text(`${type} deleted successfully`);
});

// Get many drafts of a user
userRoutes.get("/drafts", valibot("query", PageQuerySchema), async (c) => {
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

// Read a draft
userRoutes.get("/drafts/:id", async (c) => {
	const { id: authorId, email, ...author } = c.get("user") as User;
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
		output: { post, author, content },
	});
});

// Publish a post
userRoutes.post("/drafts/:id/publish", async (c) => {
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

	if (!meta.rows_updated) {
		return c.text("No draft found with the given id", 404);
	}

	return c.text("Blog post published successfully");
});

export default userRoutes;
