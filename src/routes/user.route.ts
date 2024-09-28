import { AppEnv } from "@/context";
import { postsTable, usersTable } from "@/database/tables";
import { ReadPostSchema } from "@/schemas";
import { handleDbError } from "@/utils";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { decompress } from "lzutf8";
import { parse } from "valibot";

const userRoutes = new Hono<AppEnv>().basePath("/:username");

userRoutes.get("/");

userRoutes.get("/posts");

userRoutes.get("/posts/:postId/metadata");

userRoutes.get("/drafts");

userRoutes.get("/drafts/:draftId", async (c) => {
	const username = c.req.param("username");
	const draftId = c.req.param("draftId");
	const db = drizzle(c.env.DB);
	const obj = await c.env.POSTS_BUCKET.get(`${username}/${draftId}`);

	const query = db
		.select({ post: postsTable, author: usersTable })
		.from(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(usersTable.username, sql.placeholder("username")),
				eq(postsTable.isPublished, false)
			)
		)
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.prepare();

	const data = await query.get({ id: draftId, username }).catch(handleDbError);

	if (!data) {
		return c.text("Post not found", 404);
	}

	let raw;

	if (!obj) {
		raw = data;
	} else {
		const buffer = await obj.arrayBuffer();
		const content = decompress(new Uint8Array(buffer));

		raw = {
			post: { ...data.post, content },
			author: data.author,
		};
	}

	return c.json({
		state: "success",
		message: "Draft fetched successfully",
		payload: parse(ReadPostSchema, raw),
	});
});

// userRoutes.patch("/");

export default userRoutes;
