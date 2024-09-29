import { AppEnv } from "@/context";
import { createMiddleware } from "hono/factory";

const unauth = createMiddleware<AppEnv>(async (c, next) => {
	const session = c.get("session");

	if (session) {
		return c.text("User is already logged in", 400);
	}

	await next();
});

export default unauth;
