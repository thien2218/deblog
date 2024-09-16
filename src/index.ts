import { Hono } from "hono";
import { Context } from "./context";
import { authRoutes } from "./routes";
import { csrf } from "hono/csrf";

const app = new Hono<Context>().basePath("/api");

app.use(csrf());
app.route("/", authRoutes);

app.get("/", (c) => {
	return c.json({ message: "Hello, world!" });
});

export default app;
