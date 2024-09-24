import { AppEnv } from "@/context";
import { postsTable, usersTable } from "@/database/tables";
import { auth, pageQueryValidator } from "@/middlewares";
import { SelectPostSchema } from "@/schemas/post.schema";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { parse } from "valibot";

const postRoutes = new Hono<AppEnv>().basePath("/posts");

// Get many posts
postRoutes.get("/", pageQueryValidator, async (c) => {
	const { offset, limit } = c.req.valid("query");
	const db = drizzle(c.env.DB);

	const query = db
		.select({ post: postsTable, author: usersTable })
		.from(postsTable)
		.offset(sql.placeholder("offset"))
		.limit(sql.placeholder("limit"))
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.prepare();

	const posts = await query.all({ offset, limit });

	if (!posts.length) {
		return c.json({ message: "No blog post found" }, 404);
	}

	return c.json(posts.map((post) => parse(SelectPostSchema, post)));
});

// Get one post
postRoutes.get("/");

// Create a post
postRoutes.post("/", auth);

// Update a post
postRoutes.patch("/:id", auth);

// Delete a post
postRoutes.delete("/:id", auth);

export default postRoutes;
