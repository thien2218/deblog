import { DrizzleD1Database } from "drizzle-orm/d1";
import type { Env } from "hono";
import type { User, Session, Lucia } from "lucia";

type Auth = { user: User; session: Session } | { user: null; session: null };

export interface AppEnv extends Env {
	Variables: Auth & {
		db: DrizzleD1Database;
		lucia: Lucia;
	};
	Bindings: {
		DB: D1Database;
		POSTS_BUCKET: R2Bucket;
		IMAGES_BUCKET: R2Bucket;
	};
}
