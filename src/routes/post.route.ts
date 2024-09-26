import { AppEnv } from "@/context";
import { postsTable, usersTable } from "@/database/tables";
import { auth, valibot } from "@/middlewares";
import { PageQuerySchema } from "@/schemas";
import {
	CreatePostSchema,
	PostSchema,
	SelectPostsSchema,
	UpdatePostSchema,
} from "@/schemas/post.schema";
import { handleDbError } from "@/utils";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { parse } from "valibot";

const postRoutes = new Hono<AppEnv>().basePath("/posts");

// Get many posts
postRoutes.get("/", valibot("query", PageQuerySchema), async (c) => {
	const { offset, limit } = c.req.valid("query");
	const db = drizzle(c.env.DB);

	const query = db
		.select({ post: postsTable, author: usersTable })
		.from(postsTable)
		.offset(sql.placeholder("offset"))
		.limit(sql.placeholder("limit"))
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.prepare();

	const posts = await query.all({ offset, limit }).catch(handleDbError);

	if (!posts.length) {
		return c.json({ message: "No blog posts found", state: "error" }, 404);
	}

	return c.json({
		message: "Blog posts fetched successfully",
		state: "success",
		payload: parse(SelectPostsSchema, posts),
	});
});

// Create a post
postRoutes.post("/", auth, valibot("json", CreatePostSchema), async (c) => {
	const payload = c.req.valid("json");
	const { id: authorId } = c.get("user");
	const db = drizzle(c.env.DB);

	const query = db
		.insert(postsTable)
		.values({
			id: sql.placeholder("id"),
			title: sql.placeholder("title"),
			description: sql.placeholder("description"),
			markdownUrl: sql.placeholder("markdownUrl"),
			authorId: sql.placeholder("authorId"),
		})
		.returning()
		.prepare();

	const post = await query
		.get({ id: nanoid(25), ...payload, authorId })
		.catch(handleDbError);

	return c.json(
		{
			state: "success",
			message: "Blog post created successfully",
			payload: parse(PostSchema, post),
		},
		201
	);
});

// Update a post
postRoutes.patch("/:id", auth, valibot("json", UpdatePostSchema), async (c) => {
	const payload = c.req.valid("json");
	const { id: authorId } = c.get("user");
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
			`No blog post found from this author with the given id: ${id}`,
			403
		);
	}

	return c.text("Blog post updated successfully", 204);
});

// Delete a post
postRoutes.delete("/:id", auth, async (c) => {
	const { id: authorId } = c.get("user");
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
		.prepare();

	const { meta } = await query.run({ id, authorId }).catch(handleDbError);

	if (!meta.rows_written) {
		return c.text(
			`No blog post found from this author with the given id: ${id}`,
			403
		);
	}

	return c.text("Blog post deleted successfully", 204);
});

export default postRoutes;
