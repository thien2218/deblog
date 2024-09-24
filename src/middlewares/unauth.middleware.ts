import { AppEnv } from "@/context";
import { createMiddleware } from "hono/factory";

interface UnauthEnv extends AppEnv {
	Variables: {
		user: null;
		session: null;
	} & AppEnv["Variables"];
}

const unauth = createMiddleware<UnauthEnv>(async (c, next) => {
	const session = c.get("session");

	if (session) {
		return c.json({ message: "User is already logged in" }, 400);
	}

	await next();
});

export default unauth;
