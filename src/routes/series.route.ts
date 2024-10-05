import { AppEnv } from "@/context";
import { Hono } from "hono";

const seriesRoutes = new Hono<AppEnv>().basePath("/series");

// Get series by id
seriesRoutes.get("/:id");

// Create a new series
seriesRoutes.post("/");

// Update a series
seriesRoutes.put("/:id");

// Delete a series
seriesRoutes.delete("/:id");

// Add a post to a series
seriesRoutes.post("/:id/posts");

// Remove a post from a series
seriesRoutes.delete("/:id/posts/:postId");

// Reorder posts in a series
seriesRoutes.put("/:id/posts");

export default seriesRoutes;
