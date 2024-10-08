import { AppEnv } from "@/context";
import { addReaction, isValidTarget, removeReaction } from "@/database/queries";
import { auth, valibot } from "@/middlewares";
import { CommentReactionSchema, PostReactionSchema } from "@/schemas";
import { Hono } from "hono";
import { User } from "lucia";

const reactionRoutes = new Hono<AppEnv>().basePath("/reactions");

reactionRoutes.post("*", auth);

// Add a reaction to a post
reactionRoutes.post(
	"/posts/:postId",
	valibot("json", PostReactionSchema),
	async (c) => {
		const postId = c.req.param("postId");
		const { id } = c.get("user") as User;
		const { reaction } = c.req.valid("json");

		const { valid } = await isValidTarget(c.get("db"), postId, "post");

		if (!valid) {
			return c.json({ message: "Post not found", state: "error" }, 404);
		}

		await addReaction(c.get("db"), postId, "post", id, reaction);

		return c.json(
			{ message: "Reaction added successfully", state: "success" },
			201
		);
	}
);

// Remove a reaction from a post
reactionRoutes.delete("/posts/:postId", async (c) => {
	const postId = c.req.param("postId");
	const { id } = c.get("user") as User;

	const { valid } = await isValidTarget(c.get("db"), postId, "post");

	if (!valid) {
		return c.json({ message: "Post not found", state: "error" }, 404);
	}

	await removeReaction(c.get("db"), postId, "post", id);

	return c.json(
		{ message: "Reaction removed successfully", state: "success" },
		200
	);
});

// Add a reaction to a comment
reactionRoutes.post(
	"/comments/:commentId",
	valibot("json", CommentReactionSchema),
	async (c) => {
		const commentId = c.req.param("commentId");
		const { id } = c.get("user") as User;
		const { reaction } = c.req.valid("json");

		const { valid } = await isValidTarget(c.get("db"), commentId, "comment");

		if (!valid) {
			return c.json({ message: "Comment not found", state: "error" }, 404);
		}

		await addReaction(c.get("db"), commentId, "comment", id, reaction);

		return c.json(
			{ message: "Reaction added successfully", state: "success" },
			201
		);
	}
);

// Remove a reaction from a comment
reactionRoutes.delete("/comments/:commentId", async (c) => {
	const commentId = c.req.param("commentId");
	const { id } = c.get("user") as User;

	const { valid } = await isValidTarget(c.get("db"), commentId, "comment");

	if (!valid) {
		return c.json({ message: "Comment not found", state: "error" }, 404);
	}

	await removeReaction(c.get("db"), commentId, "comment", id);

	return c.json(
		{ message: "Reaction removed successfully", state: "success" },
		200
	);
});

export default reactionRoutes;
