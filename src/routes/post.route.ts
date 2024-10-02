import { AppEnv } from "@/context";
import { postsTable, savedPostsTable, usersTable } from "@/database/tables";
import { auth, valibot } from "@/middlewares";
import { PageQuerySchema } from "@/schemas";
import { GetPostsSchema } from "@/schemas/post.schema";
import { handleDbError } from "@/utils";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { User } from "lucia";
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
		.where(eq(postsTable.published, true))
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.offset(sql.placeholder("offset"))
		.limit(sql.placeholder("limit"))
		.prepare();

	const posts = await query.all({ offset, limit }).catch(handleDbError);

	if (!posts.length) {
		return c.json({ message: "No blog posts found", state: "success" }, 404);
	}

	return c.json({
		message: "Blog posts fetched successfully",
		state: "success",
		output: parse(GetPostsSchema, posts),
	});
});

// Create a draft and get its id
postRoutes.post("/draft", auth, async (c) => {
	const { id: authorId } = c.get("user");
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

// Save a post
postRoutes.post("/:id/save", auth, async (c) => {
	const { id: userId } = c.get("user");
	const postId = c.req.param("id");
	const db = drizzle(c.env.DB);

	const query = db
		.insert(savedPostsTable)
		.values({
			postId: sql.placeholder("postId"),
			userId: sql.placeholder("userId"),
		})
		.prepare();

	await query.run({ postId, userId }).catch(handleDbError);

	return c.json({
		message: "Post saved successfully",
		state: "success",
	});
});

export default postRoutes;
