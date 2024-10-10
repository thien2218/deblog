import { Lucia, UserId } from "lucia";
import { HTTPException } from "hono/http-exception";
import { DrizzleD1Database } from "drizzle-orm/d1";
import DBAdapter from "./db-adapter";

type SQLError = { fields?: string[]; code: string };

export type SessionCache = {
	session: { expiresAt: Date };
	user: {
		id: UserId;
		email: string;
		username: string;
		hasOnboarded: boolean;
		emailVerified: boolean;
		name: string | null;
		profileImage: string | null;
	};
};

export const handleDbError = ({ message }: { message: string }) => {
	console.log(message);

	if (message.includes("SQLITE_CONSTRAINT")) {
		const chunks = message.split(": ");
		const msg = chunks[1];
		const error: SQLError = { code: chunks[chunks.length - 1] };

		if (message.includes("UNIQUE")) {
			const fields = message
				.split(": ")[2]
				.split(", ")
				.map((f) => f);

			error.fields = fields;
		}

		throw new HTTPException(400, {
			res: new Response(
				JSON.stringify({
					state: "error",
					message: msg,
					error,
				}),
				{ headers: { "Content-Type": "application/json" } }
			),
		});
	}

	throw new HTTPException(500, {
		res: new Response(
			JSON.stringify({
				state: "error",
				message,
				error: { code: "DB_ERROR" },
			}),
			{ headers: { "Content-Type": "application/json" } }
		),
	});
};

export function initializeLucia(db: DrizzleD1Database, kvProfile: KVNamespace) {
	const adapter = new DBAdapter(db, kvProfile);

	return new Lucia(adapter, {
		sessionCookie: {
			attributes: {
				secure: process.env.NODE_ENV === "production",
			},
		},
		getUserAttributes: (attr) => attr,
	});
}

declare module "lucia" {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>;
		DatabaseUserAttributes: Omit<SessionCache["user"], "id">;
	}
}

export { default as countryCodes } from "./country-codes";
