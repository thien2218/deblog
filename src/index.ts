import { Hono } from "hono";
import { AppEnv } from "./context";
import { authRoutes, postRoutes } from "./routes";
import { csrf } from "hono/csrf";
import { session, transformResponse } from "./middlewares";

const app = new Hono<AppEnv>().basePath("/api");

// Middlewares
app.use(csrf({ origin: "http://localhost:8787" }));
app.use(session);
app.use(transformResponse);

// Routes
app.route("/", authRoutes);
app.route("/", postRoutes);

export default app;
