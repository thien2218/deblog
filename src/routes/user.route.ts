import { AppEnv } from "@/context";
import { Hono } from "hono";

const userRoutes = new Hono<AppEnv>();

userRoutes.get("/:id");

userRoutes.get("/:id/posts");

userRoutes.get("/:id/posts/:postId");

// userRoutes.patch("/:id");

export default userRoutes;
