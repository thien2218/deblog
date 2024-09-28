import { AppEnv } from "@/context";
import { postsTable, usersTable } from "@/database/tables";
import { valibot } from "@/middlewares";
import { PageQuerySchema } from "@/schemas";
import { GetPostsSchema } from "@/schemas/post.schema";
import { handleDbError } from "@/utils";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { parse } from "valibot";

const postRoutes = new Hono<AppEnv>();

// Get many posts
postRoutes.get("/posts", valibot("query", PageQuerySchema), async (c) => {
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

export default postRoutes;
