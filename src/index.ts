import { Hono } from "hono";
import { AppEnv } from "./context";
import { authRoutes, postRoutes, userRoutes } from "./routes";
import { csrf } from "hono/csrf";
import { auth, session, validateResponse } from "./middlewares";

const app = new Hono<AppEnv>().basePath("/api");

/* Middlewares */
app.use(csrf({ origin: "http://localhost:8787" }));
app.use(session);
app.use(validateResponse);
// Excludes all login and signup routes from the auth middleware
app.post("^(?!.*(login|signup)).*", auth);
app.put("*", auth);
app.patch("*", auth);
app.delete("*", auth);

/* Routes */
app.route("/", authRoutes);
app.route("/", postRoutes);
app.route("/", userRoutes);

export default app;
