import { AppEnv } from "@/context";
import { getPostsInSeries, getSeriesById } from "@/database/queries";
import { auth } from "@/middlewares";
import { Hono } from "hono";

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
		data: series,
	});
});

// Get posts in a series
seriesRoutes.get("/:id/posts", async (c) => {
	const id = c.req.param("id");

	const posts = await getPostsInSeries(c.get("db"), id);

	return c.json({
		message: "Posts fetched successfully",
		state: "success",
		data: posts,
	});
});

// Create a new series
seriesRoutes.post("/", auth);

// Update a series
seriesRoutes.put("/:id");

// Delete a series
seriesRoutes.delete("/:id");

// Add posts to a series
seriesRoutes.post("/:id/posts", auth);

// Remove posts from a series
seriesRoutes.delete("/:id/posts");

// Reorder posts in a series
seriesRoutes.put("/:id/posts");

export default seriesRoutes;
