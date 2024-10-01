import { AppEnv } from "@/context";
import { postsTable, savedPostsTable, usersTable } from "@/database/tables";
import { valibot } from "@/middlewares";
import { PageQuerySchema } from "@/schemas";
import { GetPostsSchema } from "@/schemas/post.schema";
import { handleDbError } from "@/utils";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { User } from "lucia";
import { parse } from "valibot";

const postRoutes = new Hono<AppEnv>();

// Get many posts
postRoutes.get("/posts", valibot("query", PageQuerySchema), async (c) => {
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

// Save a post
postRoutes.post("/posts/:id/save", async (c) => {
	const postId = c.req.param("id");
	const { id: userId } = c.get("user") as User;
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
