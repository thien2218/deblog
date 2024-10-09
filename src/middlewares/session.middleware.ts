import { AppEnv } from "@/context";
import { initializeLucia } from "@/utils";
import { drizzle } from "drizzle-orm/d1";
import { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";

const session: MiddlewareHandler<AppEnv> = async (c, next) => {
	const db = drizzle(c.env.DB, { logger: true });
	const lucia = initializeLucia(db, c.env.KV_PROFILES);

	c.set("db", db);
	c.set("lucia", lucia);

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
};

export default session;
