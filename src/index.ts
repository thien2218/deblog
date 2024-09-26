import { Hono } from "hono";
import { AppEnv } from "./context";
import { authRoutes, postRoutes, userRoutes } from "./routes";
import { csrf } from "hono/csrf";
import { session, validateResponse } from "./middlewares";

const app = new Hono<AppEnv>().basePath("/api");

// Middlewares
app.use(csrf({ origin: "http://localhost:8787" }));
app.use(session);
app.use(validateResponse);

// Routes
app.route("/", authRoutes);
app.route("/", postRoutes);
app.route("/", userRoutes);

export default app;
