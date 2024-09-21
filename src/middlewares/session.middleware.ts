import { AppEnv } from "@/context";
import { initializeLucia } from "@/utils";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

const session = createMiddleware<AppEnv>(async (c, next) => {
	const lucia = initializeLucia(c.env.DB);
	const sessionId = getCookie(c, lucia.sessionCookieName);

	if (!sessionId) {
		c.set("user", null);
		c.set("session", null);
		return next();
	}

	const { session, user } = await lucia.validateSession(sessionId);

	if (session && session.fresh) {
		c.header(
			"Set-Cookie",
			lucia.createSessionCookie(session.id).serialize(),
			{ append: true }
		);
	} else if (!session) {
		c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
			append: true,
		});
	}

	c.set("user", user);
	c.set("session", session);
	return next();
});

export default session;
