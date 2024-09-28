import type { Env } from "hono";
import type { User, Session } from "lucia";

type Auth = { user: User; session: Session } | { user: null; session: null };

export interface AppEnv extends Env {
	Variables: Auth & {};
	Bindings: {
		DB: D1Database;
		POSTS_BUCKET: R2Bucket;
	};
}
