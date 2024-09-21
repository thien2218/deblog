import type { Env } from "hono";
import type { User, Session } from "lucia";

export interface AppEnv extends Env {
	Variables: {
		user: User | null;
		session: Session | null;
		parsedBody: object | undefined;
	};
	Bindings: {
		DB: D1Database;
	};
}
