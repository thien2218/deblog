import { Hono } from "hono";
import { Context } from "./context";
import { authRoutes } from "./routes";

const app = new Hono<Context>();

app.route("/", authRoutes);

export default app;
