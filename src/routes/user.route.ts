import { AppEnv } from "@/context";
import { postsTable, savedPostsTable, usersTable } from "@/database/tables";
import { auth, valibot } from "@/middlewares";
import {
	GetPostsSchema,
	PageQuerySchema,
	ReadPostSchema,
	UpdatePostContentSchema,
	UpdatePostMetadataSchema,
} from "@/schemas";
import { GetProfileSchema, UpdateProfileSchema } from "@/schemas/user.schema";
import { handleDbError } from "@/utils";
import { and, desc, eq, exists, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono, MiddlewareHandler } from "hono";
import { User } from "lucia";
import { nanoid } from "nanoid";
import { parse } from "valibot";

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

userRoutes.use("/drafts/*", isAuthorized);
userRoutes.put("*", isAuthorized);
userRoutes.patch("*", isAuthorized);
userRoutes.delete("*", isAuthorized);

// Get the user's profile
userRoutes.get("/profile", async (c) => {
	const username = c.req.param("username");
	const db = drizzle(c.env.DB);

	const query = db
		.select()
		.from(usersTable)
		.where(eq(usersTable.username, sql.placeholder("username")))
		.prepare();

	const data = await query.get({ username }).catch(handleDbError);

	if (!data) {
		return c.json({ state: "success", message: "User not found" }, 404);
	}

	return c.json({
		state: "success",
		message: "User fetched successfully",
		output: parse(GetProfileSchema, data),
	});
});

// Update user profile
userRoutes.patch(
	"/profile",
	valibot("json", UpdateProfileSchema),
	async (c) => {
		const { id: userId } = c.get("user") as User;
		const payload = c.req.valid("json");
		const db = drizzle(c.env.DB);

		const query = db
			.update(usersTable)
			.set(payload)
			.where(eq(usersTable.id, sql.placeholder("userId")))
			.prepare();

		const { meta } = await query.run({ userId }).catch(handleDbError);

		if (!meta.rows_updated) {
			return c.text("User not found", 404);
		}

		return c.text("User profile updated successfully");
	}
);

// Get the user's posts
userRoutes.get("/posts", valibot("query", PageQuerySchema), async (c) => {
	const { id: authorId } = c.get("user") as User;
	const db = drizzle(c.env.DB);
	const { offset, limit } = c.req.valid("query");

	const query = db
		.select({ post: postsTable, author: usersTable })
		.from(postsTable)
		.where(
			and(
				eq(usersTable.username, sql.placeholder("username")),
				eq(postsTable.authorId, usersTable.id),
				eq(postsTable.published, true)
			)
		)
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.orderBy(desc(postsTable.createdAt))
		.limit(sql.placeholder("limit"))
		.offset(sql.placeholder("offset"))
		.prepare();

	const data = await query
		.all({ authorId, limit, offset })
		.catch(handleDbError);

	if (!data.length) {
		return c.json({ state: "success", message: "No posts found" }, 404);
	}

	return c.json({
		state: "success",
		message: "Posts fetched successfully",
		output: parse(GetPostsSchema, data),
	});
});

// Read post from a user
userRoutes.get("/posts/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const db = drizzle(c.env.DB);
	const bucket = c.env.POSTS_BUCKET;

	const query = db
		.select({ post: postsTable, author: usersTable })
		.from(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.published, true)
			)
		)
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.prepare();

	const data = await query.get({ id, authorId }).catch(handleDbError);

	if (!data) {
		return c.json({ state: "success", message: "Post not found" }, 404);
	}

	const obj = await bucket.get(`${authorId}/${id}`);

	if (!obj) {
		return c.text("No post found in the bucket", 404);
	}

	const content = await obj.text();
	// @ts-ignore
	data.post.content = content;

	return c.json({
		state: "success",
		message: "Post fetched successfully",
		output: parse(ReadPostSchema, data),
	});
});

// Get saved posts of a user
userRoutes.get(
	"/posts/saved",
	auth,
	isAuthorized,
	valibot("query", PageQuerySchema),
	async (c) => {
		const { id: userId } = c.get("user") as User;
		const db = drizzle(c.env.DB);
		const { offset, limit } = c.req.valid("query");

		const query = db
			.select({ post: postsTable, author: usersTable })
			.from(savedPostsTable)
			.where(
				and(
					eq(savedPostsTable.userId, sql.placeholder("userId")),
					eq(postsTable.id, savedPostsTable.postId)
				)
			)
			.innerJoin(postsTable, eq(postsTable.id, savedPostsTable.postId))
			.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
			.orderBy(desc(savedPostsTable.savedAt))
			.limit(sql.placeholder("limit"))
			.offset(sql.placeholder("offset"))
			.prepare();

		const data = await query
			.all({ userId, limit, offset })
			.catch(handleDbError);

		if (!data.length) {
			return c.json(
				{ state: "success", message: "No saved posts found" },
				404
			);
		}

		return c.json({
			state: "success",
			message: "Saved posts fetched successfully",
			output: parse(GetPostsSchema, data),
		});
	}
);

// Update a post/draft metadata
userRoutes.put(
	"/write-ups/:id/metadata",
	valibot("json", UpdatePostMetadataSchema),
	async (c) => {
		const payload = c.req.valid("json");
		const { id: authorId } = c.get("user") as User;
		const db = drizzle(c.env.DB);
		const id = c.req.param("id");

		const query = db
			.update(postsTable)
			.set(payload)
			.where(
				and(
					eq(postsTable.id, sql.placeholder("id")),
					eq(postsTable.authorId, sql.placeholder("authorId"))
				)
			)
			.prepare();

		const { meta } = await query.run({ id, authorId }).catch(handleDbError);

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
		const { id: authorId } = c.get("user") as User;
		const id = c.req.param("id");
		const { content } = c.req.valid("json");
		const db = drizzle(c.env.DB);
		const bucket = c.env.POSTS_BUCKET;

		const query = db.select().from(
			exists(
				db
					.select({ n: sql`1` })
					.from(postsTable)
					.where(
						and(
							eq(postsTable.id, sql.placeholder("id")),
							eq(postsTable.authorId, sql.placeholder("authorId"))
						)
					)
			)
		);

		const notFound = !(await query
			.get({ id, authorId })
			.catch(handleDbError));

		if (notFound) {
			return c.text("No post/draft found with the given id", 404);
		}

		try {
			// Check if the post exists in the bucket
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
	const db = drizzle(c.env.DB);
	const bucket = c.env.POSTS_BUCKET;

	const query = db
		.delete(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId"))
			)
		)
		.returning({ isPublished: postsTable.published })
		.prepare();

	const data = await query.get({ id, authorId }).catch(handleDbError);

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
	const { id: authorId } = c.get("user") as User;
	const db = drizzle(c.env.DB);
	const { offset, limit } = c.req.valid("query");

	const query = db
		.select({ post: postsTable, author: usersTable })
		.from(postsTable)
		.where(
			and(
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.published, false)
			)
		)
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.orderBy(desc(postsTable.createdAt))
		.limit(sql.placeholder("limit"))
		.offset(sql.placeholder("offset"))
		.prepare();

	const data = await query
		.all({ authorId, limit, offset })
		.catch(handleDbError);

	if (!data.length) {
		return c.json({ state: "success", message: "No drafts found" }, 404);
	}

	return c.json({
		state: "success",
		message: "Drafts fetched successfully",
		output: parse(GetPostsSchema, data),
	});
});

// Get a draft
userRoutes.get("/drafts/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const db = drizzle(c.env.DB);
	const bucket = c.env.POSTS_BUCKET;

	const query = db
		.select({ post: postsTable, author: usersTable })
		.from(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.published, false)
			)
		)
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.prepare();

	const data = await query.get({ id, authorId }).catch(handleDbError);

	if (!data) {
		return c.json({ state: "success", message: "Draft not found" }, 404);
	}

	const obj = await bucket.get(`${authorId}/${id}`);

	if (!obj) {
		return c.text("No draft found in the bucket", 404);
	}

	const content = await obj.text();
	// @ts-ignore
	data.post.content = content;

	return c.json({
		state: "success",
		message: "Draft fetched successfully",
		output: parse(ReadPostSchema, data),
	});
});

// Create and get the draft id
userRoutes.post("/drafts", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = nanoid(25);
	const db = drizzle(c.env.DB);
	const bucket = c.env.POSTS_BUCKET;

	const query = db
		.insert(postsTable)
		.values({
			id: sql.placeholder("id"),
			authorId: sql.placeholder("authorId"),
			title: "Untitled",
		})
		.prepare();

	await query.run({ id, authorId }).catch(handleDbError);
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

// Publish a post
userRoutes.post("/drafts/:id/publish", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const db = drizzle(c.env.DB);
	const bucket = c.env.POSTS_BUCKET;

	const obj = await bucket.get(`${authorId}/${id}`);

	if (!obj) {
		return c.text("No draft found in the bucket", 404);
	}

	const content = await obj.text();

	if (content.length < 1000) {
		return c.text("Post content is too short to be published", 400);
	}

	const query = db
		.update(postsTable)
		.set({ published: true })
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.published, false)
			)
		)
		.prepare();

	const { meta } = await query.run({ id, authorId }).catch(handleDbError);

	if (!meta.rows_updated) {
		return c.text("No draft found with the given id", 404);
	}

	return c.text("Blog post published successfully");
});

export default userRoutes;
