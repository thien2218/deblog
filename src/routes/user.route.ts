import { AppEnv } from "@/context";
import { Hono } from "hono";

const userRoutes = new Hono<AppEnv>();

userRoutes.get("/:username");

userRoutes.get("/:username/posts");

userRoutes.get("/:username/posts/:postId");

// userRoutes.patch("/:username");

export default userRoutes;
