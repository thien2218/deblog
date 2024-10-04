import { AppEnv } from "@/context";
import {
	addComment,
	deleteComment,
	editComment,
	getCommentsOfPost,
} from "@/database/queries";
import { auth, valibot } from "@/middlewares";
import { CommentSchema, PageQuerySchema } from "@/schemas";
import { Hono } from "hono";
import { User } from "lucia";

const commentRoutes = new Hono<AppEnv>().basePath("/posts/:postId/comments");

// Get comments of a post
commentRoutes.get("/", valibot("query", PageQuerySchema), async (c) => {
	const postId = c.req.param("postId");
	const page = c.req.valid("query");

	const comments = await getCommentsOfPost(c.get("db"), postId, page);

	if (!comments.length) {
		return c.json({ message: "No comments found", state: "success" }, 404);
	}

	return c.json({
		message: "Comments fetched successfully",
		state: "success",
		output: comments,
	});
});

// Add a comment to a post
commentRoutes.post("/", auth, valibot("json", CommentSchema), async (c) => {
	const postId = c.req.param("postId");
	const { id: authorId } = c.get("user");
	const { content } = c.req.valid("json");

	await addComment(c.get("db"), postId, authorId, content);

	return c.json(
		{ message: "Comment added successfully", state: "success" },
		201
	);
});

// Edit a comment
commentRoutes.put("/:commentId", valibot("json", CommentSchema), async (c) => {
	const commentId = c.req.param("commentId");
	const postId = c.req.param("postId");
	const { id: authorId } = c.get("user") as User;
	const { content } = c.req.valid("json");

	const { meta } = await editComment(
		c.get("db"),
		commentId,
		postId,
		authorId,
		content
	);

	if (!meta.rows_written) {
		return c.json({ message: "Comment not found", state: "error" }, 404);
	}

	return c.json({ message: "Comment updated successfully", state: "success" });
});

// Delete a comment
commentRoutes.delete("/:commentId", async (c) => {
	const commentId = c.req.param("commentId");
	const postId = c.req.param("postId");
	const { id: authorId } = c.get("user") as User;

	const { meta } = await deleteComment(
		c.get("db"),
		commentId,
		postId,
		authorId
	);

	if (!meta.rows_affected) {
		return c.json({ message: "Comment not found", state: "error" }, 404);
	}

	return c.json({ message: "Comment deleted successfully", state: "success" });
});

export default commentRoutes;
