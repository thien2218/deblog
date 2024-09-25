import { AppEnv } from "@/context";
import { postsTable, usersTable } from "@/database/tables";
import { auth, valibot } from "@/middlewares";
import { NanoidSchema, PageQuerySchema } from "@/schemas";
import {
	CreatePostSchema,
	SelectPostSchema,
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
		return c.json({ message: "No blog posts found" }, 404);
	}

	return c.json(posts.map((post) => parse(SelectPostSchema, post)));
});

// Get one post
postRoutes.get("/:id", valibot("param", NanoidSchema), async (c) => {
	const db = drizzle(c.env.DB);
	const id = c.req.valid("param");

	const query = db
		.select({ post: postsTable, author: usersTable })
		.from(postsTable)
		.where(eq(postsTable.id, sql.placeholder("id")))
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.prepare();

	const post = await query.get({ id }).catch(handleDbError);

	if (!post) {
		return c.json({ message: "Blog post not found" }, 404);
	}

	return c.json(parse(SelectPostSchema, post));
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
			summary: sql.placeholder("summary"),
			markdownUrl: sql.placeholder("markdownUrl"),
			authorId: sql.placeholder("authorId"),
		})
		.prepare();

	await query
		.execute({ id: nanoid(25), ...payload, authorId })
		.catch(handleDbError);

	return c.json({ message: "Post created successfully" }, 201);
});

// Update a post
postRoutes.patch(
	"/:id",
	auth,
	valibot("param", NanoidSchema),
	valibot("json", UpdatePostSchema),
	async (c) => {
		const payload = c.req.valid("json");
		const { id: authorId } = c.get("user");
		const db = drizzle(c.env.DB);
		const id = c.req.valid("param");

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
			return c.json(
				{
					message:
						"No post associated with this author found from specified post id",
				},
				403
			);
		}

		return c.json({ message: "Post updated successfully" });
	}
);

// Delete a post
postRoutes.delete("/:id", valibot("param", NanoidSchema), auth, async (c) => {
	const { id: authorId } = c.get("user");
	const db = drizzle(c.env.DB);
	const id = c.req.valid("param");

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
		return c.json(
			{
				message:
					"No post associated with this author found from specified post id",
			},
			403
		);
	}

	return c.json({ message: "Post deleted successfully" }, 204);
});

export default postRoutes;
