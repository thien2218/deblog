import { Hono } from "hono";
import { AppEnv } from "./context";
import {
	authRoutes,
	commentRoutes,
	draftRoutes,
	postRoutes,
	seriesRoutes,
	tagRoutes,
	uploadRoutes,
	userRoutes,
} from "./routes";
import { csrf } from "hono/csrf";
import { auth, session, validateResponse } from "./middlewares";

const app = new Hono<AppEnv>().basePath("/api");

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

export default app;
