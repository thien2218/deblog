import { AppEnv } from "@/context";
import { contentsTable, postsTable, usersTable } from "@/database/tables";
import { auth, valibot } from "@/middlewares";
import {
	GetPostsSchema,
	PageQuerySchema,
	ReadPostSchema,
	UpdatePostContentSchema,
	UpdatePostMetadataSchema,
} from "@/schemas";
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

userRoutes.use("/drafts/*", auth, isAuthorized);
userRoutes.put("*", auth, isAuthorized);
userRoutes.patch("*", auth, isAuthorized);
userRoutes.delete("*", auth, isAuthorized);

// Get the user's profile
userRoutes.get("/profile");

// Update user profile
userRoutes.patch("/profile");

// Get the user's posts
userRoutes.get("/posts");

// Read post from a user
userRoutes.get("/posts/:id");

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
				`No published blog post from this author with the given id: ${id}`,
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
		const db = drizzle(c.env.DB);
		const id = c.req.param("id");
		const payload = c.req.valid("json");

		const subquery = db
			.select()
			.from(postsTable)
			.where(
				and(
					eq(postsTable.id, sql.placeholder("id")),
					eq(postsTable.authorId, sql.placeholder("authorId"))
				)
			);

		const query = db
			.update(contentsTable)
			.set(payload)
			.where(
				and(
					eq(contentsTable.postId, sql.placeholder("id")),
					exists(subquery)
				)
			)
			.prepare();

		const { meta } = await query.run({ id, authorId }).catch(handleDbError);

		if (!meta.rows_written) {
			return c.text(
				`No published blog post from this author with the given id: ${id}`,
				403
			);
		}

		return c.text("Blog post content updated successfully");
	}
);

// Delete a post/draft
userRoutes.delete("/write-ups/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const db = drizzle(c.env.DB);
	const id = c.req.param("id");

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
			`No post/draft found from this author with the given id: ${id}`,
			403
		);
	}

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
		payload: parse(GetPostsSchema, data),
	});
});

// Get a draft
userRoutes.get("/drafts/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const db = drizzle(c.env.DB);

	const query = db
		.select({
			post: postsTable,
			author: usersTable,
			content: contentsTable.content,
		})
		.from(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.published, false)
			)
		)
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.innerJoin(contentsTable, eq(postsTable.id, contentsTable.postId))
		.prepare();

	const data = await query.get({ id, authorId }).catch(handleDbError);

	if (!data) {
		return c.json({ state: "success", message: "Draft not found" }, 404);
	}

	return c.json({
		state: "success",
		message: "Draft fetched successfully",
		payload: parse(ReadPostSchema, data),
	});
});

// Create and get the draft id
userRoutes.post("/drafts", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = nanoid(25);
	const db = drizzle(c.env.DB);

	await db.batch([
		db.insert(postsTable).values({ id, authorId, title: "Untitled" }),
		db.insert(contentsTable).values({ postId: id, content: "" }),
	]);

	return c.json(
		{
			state: "success",
			message: "Draft created successfully",
			payload: { id },
		},
		201
	);
});

// Publish a post
userRoutes.post("/drafts/:id/publish", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const db = drizzle(c.env.DB);

	const selectQuery = db
		.select({
			authorId: postsTable.authorId,
			published: postsTable.published,
			content: contentsTable.content,
		})
		.from(postsTable)
		.innerJoin(contentsTable, eq(postsTable.id, contentsTable.postId))
		.where(eq(postsTable.id, sql.placeholder("id")))
		.prepare();

	const post = await selectQuery.get({ id }).catch(handleDbError);

	if (!post) {
		return c.text(`Draft not found with the given id: ${id}`, 404);
	}
	if (post.authorId !== authorId) {
		return c.text("You are not the author of this draft", 403);
	}
	if (post.published) {
		return c.text("This post is already published", 400);
	}
	if (post.content.length < 1000) {
		return c.text("Post content is too short to be published", 400);
	}

	const updateQuery = db
		.update(postsTable)
		.set({ published: true })
		.where(eq(postsTable.id, sql.placeholder("id")))
		.prepare();

	await updateQuery.run({ id, authorId }).catch(handleDbError);

	return c.text("Blog post published successfully");
});

export default userRoutes;
