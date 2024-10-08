import { AppEnv } from "@/context";
import {
	addTagsToPost,
	findExistsPost,
	removeTagsFromPost,
} from "@/database/queries";
import { auth, valibot } from "@/middlewares";
import { TagsSchema } from "@/schemas";
import { Hono } from "hono";
import { User } from "lucia";

const tagRoutes = new Hono<AppEnv>();

// Add tags to a post
tagRoutes.post(
	"posts/:id/tags",
	auth,
	valibot("json", TagsSchema),
	async (c) => {
		const postId = c.req.param("id");
		const { id: authorId } = c.get("user");
		const tags = c.req.valid("json");

		const { exists } = await findExistsPost(c.get("db"), postId, authorId);

		if (!exists) {
			return c.json({ message: "Post not found", state: "error" }, 404);
		}

		await addTagsToPost(c.get("db"), postId, tags);

		return c.json({
			message: "Tags added successfully",
			state: "success",
		});
	}
);

// Remove tags from a post
tagRoutes.delete("posts/:id/tags", valibot("json", TagsSchema), async (c) => {
	const postId = c.req.param("id");
	const { id: authorId } = c.get("user") as User;
	const tags = c.req.valid("json");

	const { exists } = await findExistsPost(c.get("db"), postId, authorId);

	if (!exists) {
		return c.json({ message: "Post not found", state: "error" }, 404);
	}

	const removed = (await removeTagsFromPost(c.get("db"), postId, tags)).map(
		({ tag }) => tag
	);

	return c.json({
		message: "Tags removed successfully",
		state: "success",
		output: removed,
	});
});

export default tagRoutes;
