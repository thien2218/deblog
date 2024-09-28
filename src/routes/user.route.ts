import { AppEnv } from "@/context";
import { postsTable, usersTable } from "@/database/tables";
import { auth, valibot } from "@/middlewares";
import { ReadPostSchema, UpdatePostSchema } from "@/schemas";
import { handleDbError } from "@/utils";
import { and, eq, sql } from "drizzle-orm";
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
userRoutes.patch("*", auth, isAuthorized);
userRoutes.delete("*", auth, isAuthorized);

// Get the user's profile
userRoutes.get("/");

// Get the user's posts
userRoutes.get("/posts");

// Read post from a user
userRoutes.get("/posts/:id");

// Update a post
userRoutes.patch("/posts/:id", valibot("json", UpdatePostSchema), async (c) => {
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
userRoutes.delete("/posts/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const db = drizzle(c.env.DB);
	const id = c.req.param("id");

	const query = db
		.delete(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.isPublished, true)
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

// Get many drafts of a user
userRoutes.get("/drafts");

// Get a draft
userRoutes.get("/drafts/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const db = drizzle(c.env.DB);

	const query = db
		.select({ post: postsTable, author: usersTable })
		.from(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.isPublished, false)
			)
		)
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.prepare();

	const data = await query.get({ id, authorId }).catch(handleDbError);

	if (!data) {
		return c.json({ state: "error", message: "Draft not found" }, 404);
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

	const query = db
		.insert(postsTable)
		.values({
			id: sql.placeholder("id"),
			authorId: sql.placeholder("authorId"),
			title: "Untitled",
			content: "",
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
userRoutes.patch(
	"/drafts/:id",
	valibot("json", UpdatePostSchema),
	async (c) => {
		const { id: authorId } = c.get("user") as User;
		const id = c.req.param("id");
		const payload = c.req.valid("json");
		const db = drizzle(c.env.DB);

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

		const { meta } = await query.run({ id, authorId }).catch(handleDbError);

		if (!meta.rows_written) {
			return c.text(
				`No draft found from this author with the given id: ${id}`,
				403
			);
		}

		return c.text("Draft saved successfully");
	}
);

// Publish a post
userRoutes.post("/drafts/:id/publish", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const db = drizzle(c.env.DB);

	const selectQuery = db
		.select()
		.from(postsTable)
		.where(eq(postsTable.id, sql.placeholder("id")))
		.prepare();

	const post = await selectQuery.get({ id }).catch(handleDbError);

	if (!post) {
		return c.text(`Draft not found with the given id: ${id}`, 404);
	}
	if (post.authorId !== authorId) {
		return c.text("You are not the author of this draft", 403);
	}
	if (post.isPublished) {
		return c.text("This post is already published", 400);
	}
	if (post.content.length < 10) {
		return c.text("Post content is too short to be published", 400);
	}

	const updateQuery = db
		.update(postsTable)
		.set({ isPublished: true })
		.where(eq(postsTable.id, sql.placeholder("id")))
		.prepare();

	await updateQuery.run({ id, authorId }).catch(handleDbError);

	return c.text("Blog post published successfully");
});

// Delete a draft
userRoutes.delete("/drafts/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const db = drizzle(c.env.DB);

	const query = db
		.delete(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.isPublished, false)
			)
		)
		.prepare();

	const { meta } = await query.run({ id, authorId }).catch(handleDbError);

	if (!meta.rows_affected) {
		return c.text(
			`No draft found from this author with the given id: ${id}`,
			403
		);
	}

	return c.text("Draft deleted successfully");
});

// Update user profile
userRoutes.patch("/");

export default userRoutes;
