import { AppEnv } from "@/context";
import {
	addPostsToSeries,
	arePostsByAuthor,
	createSeries,
	deleteSeries,
	getPostsInSeries,
	getSeriesById,
	getSeriesMaxOrder,
	isSeriesByAuthor,
	updateSeries,
} from "@/database/queries";
import { auth, valibot } from "@/middlewares";
import {
	AddPostsToSeriesSchema,
	CreateSeriesSchema,
	UpdateSeriesSchema,
} from "@/schemas";
import { Hono } from "hono";
import { User } from "lucia";

const seriesRoutes = new Hono<AppEnv>().basePath("/series");

// Get series by id
seriesRoutes.get("/:id", async (c) => {
	const id = c.req.param("id");

	const series = await getSeriesById(c.get("db"), id);

	if (!series) {
		return c.json({ message: "Series not found", state: "error" }, 404);
	}

	return c.json({
		message: "Series fetched successfully",
		state: "success",
		output: series,
	});
});

// Get posts in a series
seriesRoutes.get("/:id/posts", async (c) => {
	const id = c.req.param("id");

	const posts = await getPostsInSeries(c.get("db"), id);

	return c.json({
		message: "Posts fetched successfully",
		state: "success",
		output: posts,
	});
});

// Create a new series
seriesRoutes.post("/", auth, valibot("json", CreateSeriesSchema), async (c) => {
	const { id: authorId } = c.get("user");
	const payload = c.req.valid("json");

	const seriesId = await createSeries(c.get("db"), authorId, payload);

	return c.json({
		message: "Series created successfully",
		state: "success",
		output: { id: seriesId },
	});
});

// Update a series
seriesRoutes.put("/:id", valibot("json", UpdateSeriesSchema), async (c) => {
	const id = c.req.param("id");
	const { id: authorId } = c.get("user") as User;
	const payload = c.req.valid("json");

	const { meta } = await updateSeries(c.get("db"), id, authorId, payload);

	if (!meta.rows_written) {
		return c.json({ message: "Series not found", state: "error" }, 404);
	}

	return c.json({
		message: "Series updated successfully",
		state: "success",
	});
});

// Delete a series
seriesRoutes.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: authorId } = c.get("user") as User;

	const { meta } = await deleteSeries(c.get("db"), id, authorId);

	if (!meta.rows_affected) {
		return c.json({ message: "Series not found", state: "error" }, 404);
	}

	return c.json({
		message: "Series deleted successfully",
		state: "success",
	});
});

// Add posts to a series
seriesRoutes.post(
	"/:id/posts",
	auth,
	valibot("json", AddPostsToSeriesSchema),
	async (c) => {
		const id = c.req.param("id");
		const { id: authorId } = c.get("user") as User;
		const { postIds } = c.req.valid("json");

		const { valid } = await isSeriesByAuthor(c.get("db"), id, authorId);

		if (!valid) {
			return c.json(
				{
					message: "You are not authorized to perform this action",
					state: "error",
				},
				403
			);
		}

		const maxOrder = await getSeriesMaxOrder(c.get("db"), id);

		const validPosts = (
			await arePostsByAuthor(c.get("db"), authorId, postIds)
		).map(({ postId }, index) => ({
			postId,
			seriesId: id,
			order: maxOrder + index + 1,
		}));

		await addPostsToSeries(c.get("db"), validPosts);

		return c.json({
			message: "Posts added to series successfully",
			state: "success",
			output: validPosts,
		});
	}
);

// Remove posts from a series
seriesRoutes.delete("/:id/posts");

// Reorder posts in a series
seriesRoutes.put("/:id/posts");

export default seriesRoutes;
