import { AppEnv } from "@/context";
import {
	findDrafts,
	insertDraft,
	publishDraft,
	readDraft,
} from "@/database/queries";
import { auth, valibot } from "@/middlewares";
import { PageQuerySchema } from "@/schemas";
import { Hono } from "hono";
import { User } from "lucia";
import { nanoid } from "nanoid";

const draftRoutes = new Hono<AppEnv>().basePath("/drafts");

draftRoutes.use("*", auth);

// Get drafts of a user
draftRoutes.get("/drafts", valibot("query", PageQuerySchema), async (c) => {
	const { id: authorId, email, ...author } = c.get("user") as User;
	const page = c.req.valid("query");

	const posts = await findDrafts(c.get("db"), authorId, page);

	if (!posts.length) {
		return c.json({ state: "success", message: "No drafts found" }, 404);
	}

	return c.json({
		state: "success",
		message: "Drafts fetched successfully",
		output: posts.map((post) => ({ post, author })),
	});
});

// Create a draft
draftRoutes.post("/drafts", async (c) => {
	const id = nanoid(25);
	const { id: authorId } = c.get("user") as User;
	const bucket = c.env.POSTS_BUCKET;

	await insertDraft(c.get("db"), id, authorId);
	await bucket.put(`posts/${id}`, "");

	return c.json(
		{
			state: "success",
			message: "Draft created successfully",
			output: { id },
		},
		201
	);
});

// Read a draft
draftRoutes.get("/drafts/:id", async (c) => {
	const { id: authorId } = c.get("user") as User;
	const id = c.req.param("id");
	const bucket = c.env.POSTS_BUCKET;

	const post = await readDraft(c.get("db"), id, authorId);

	if (!post) {
		return c.json({ state: "success", message: "Draft not found" }, 404);
	}

	const obj = await bucket.get(`posts/${id}`);

	if (!obj) {
		return c.json({ state: "success", message: "Draft not found" }, 404);
	}

	const content = await obj.text();

	return c.json({
		state: "success",
		message: "Draft fetched successfully",
		output: { ...post, content },
	});
});

// Publish a post
draftRoutes.post("/drafts/:id/publish", async (c) => {
	const id = c.req.param("id");
	const { id: authorId } = c.get("user") as User;
	const bucket = c.env.POSTS_BUCKET;

	const obj = await bucket.get(`posts/${id}`);

	if (!obj) {
		return c.text("No draft found in the bucket", 404);
	}

	const content = await obj.text();

	if (content.length < 1000) {
		return c.text("Post content is too short to be published", 400);
	}

	const { meta } = await publishDraft(c.get("db"), id, authorId);

	if (!meta.rows_written) {
		return c.text("No draft found with the given id", 404);
	}

	return c.text("Blog post published successfully");
});

export default draftRoutes;
