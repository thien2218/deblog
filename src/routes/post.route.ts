import { AppEnv } from "@/context";
import { postsTable, usersTable } from "@/database/tables";
import { auth, valibot } from "@/middlewares";
import { PageQuerySchema } from "@/schemas";
import { GetPostsSchema, UpdatePostSchema } from "@/schemas/post.schema";
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
		payload: parse(GetPostsSchema, posts),
	});
});

// Create and get the draft id
postRoutes.post("/draft", auth, async (c) => {
	const id = nanoid(25);
	const db = drizzle(c.env.DB);
	const { id: authorId } = c.get("user");

	const query = db
		.insert(postsTable)
		.values({
			id: sql.placeholder("id"),
			authorId: sql.placeholder("authorId"),
			title: "Untitled",
		})
		.prepare();

	await query.run({ id, authorId }).catch(handleDbError);

	return c.json(
		{
			state: "success",
			message: "Draft created successfully",
			payload: { id },
		},
		201
	);
});

// Update a draft
postRoutes.patch(
	"/draft/:id",
	auth,
	valibot("json", UpdatePostSchema),
	async (c) => {
		const db = drizzle(c.env.DB);
		const id = c.req.param("id");
		const { id: authorId, username } = c.get("user");
		const { compressed, ...payload } = c.req.valid("json");

		if (Object.keys(payload).length > 0) {
			const query = db
				.update(postsTable)
				.set(payload)
				.where(
					and(
						eq(postsTable.id, sql.placeholder("id")),
						eq(postsTable.authorId, sql.placeholder("authorId")),
						eq(postsTable.isPublished, false)
					)
				)
				.prepare();

			const { meta } = await query
				.run({ id, authorId })
				.catch(handleDbError);

			if (!meta.rows_written) {
				return c.text(
					`No draft found from this author with the given id: ${id}`,
					403
				);
			}
		}

		if (compressed) {
			await c.env.POSTS_BUCKET.put(`${username}/${id}`, compressed);
		}

		return c.text("Draft saved successfully");
	}
);

// Publish a post
postRoutes.post("/draft/:id/publish", auth, async (c) => {
	const db = drizzle(c.env.DB);
	const id = c.req.param("id");
	const { id: authorId } = c.get("user");

	const query = db
		.update(postsTable)
		.set({ isPublished: true })
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
			`No draft found from this author with the given id: ${id}`,
			403
		);
	}

	return c.text("Blog post published successfully");
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
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.isPublished, true)
			)
		)
		.prepare();

	const { meta } = await query.run({ id, authorId }).catch(handleDbError);

	if (!meta.rows_written) {
		return c.text(
			`No published blog post found from this author with the given id: ${id}`,
			403
		);
	}

	return c.text("Blog post updated successfully");
});

// Delete a post/draft
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
		.returning({ isPublished: postsTable.isPublished })
		.prepare();

	const res = await query.get({ id, authorId }).catch(handleDbError);

	if (!res) {
		return c.text(
			`No blog post found from this author with the given id: ${id}`,
			403
		);
	}

	const type = res.isPublished ? "Blog post" : "Draft";

	return c.text(`${type} deleted successfully`);
});

export default postRoutes;
