import { AppEnv } from "@/context";
import { auth, session, validateResponse } from "@/middlewares";
import { Hono } from "hono";
import { csrf } from "hono/csrf";
import authRoutes from "./auth.route";
import postRoutes from "./post.route";
import userRoutes from "./user.route";
import uploadRoutes from "./upload.route";
import commentRoutes from "./comment.route";
import seriesRoutes from "./series.route";
import draftRoutes from "./draft.route";
import tagRoutes from "./tag.route";
import reactionRoutes from "./reaction.route";

export const app = new Hono<AppEnv>().basePath("/api");

/* Middlewares */
app.use(csrf({ origin: "http://localhost:8787" }));
app.use(session);
app.use(validateResponse);
app.put("*", auth);
app.patch("*", auth);
app.delete("*", auth);

/* Routes */
app.route("/", authRoutes);
app.route("/", postRoutes);
app.route("/", userRoutes);
app.route("/", uploadRoutes);
app.route("/", commentRoutes);
app.route("/", seriesRoutes);
app.route("/", draftRoutes);
app.route("/", tagRoutes);
app.route("/", reactionRoutes);
