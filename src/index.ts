import { Hono } from "hono";
import { AppEnv } from "./context";
import { authRoutes } from "./routes";
import { csrf } from "hono/csrf";
import { parseBody, session } from "./middlewares";

const app = new Hono<AppEnv>().basePath("/api");

// Middlewares
app.use(csrf({ origin: "http://localhost:8787" }));
app.use(session);
app.use(parseBody);

// Routes
app.route("/", authRoutes);

app.get("/", (c) => {
	return c.json({ message: "Hello, world!" });
});

export default app;
