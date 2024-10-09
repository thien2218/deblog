import { Lucia } from "lucia";
import { HTTPException } from "hono/http-exception";
import { DrizzleD1Database } from "drizzle-orm/d1";
import DBAdapter from "./db-adapter";

type SQLError = { fields?: string[]; code: string };

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

export function initializeLucia(db: DrizzleD1Database) {
	const adapter = new DBAdapter(db);

	return new Lucia(adapter, {
		sessionCookie: {
			attributes: {
				secure: process.env.NODE_ENV === "production",
			},
		},
		getUserAttributes: (attr) => ({
			email: attr.email,
			username: attr.username,
			name: attr.name,
			profileImage: attr.profileImage,
			hasOnboarded: attr.hasOnboarded,
		}),
	});
}

declare module "lucia" {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>;
		DatabaseUserAttributes: {
			email: string;
			username: string;
			name: string | null;
			profileImage: string | null;
			hasOnboarded: boolean;
		};
	}
}

export { default as countryCodes } from "./country-codes";
