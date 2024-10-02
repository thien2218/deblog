import { Lucia } from "lucia";
import { HTTPException } from "hono/http-exception";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { sessionsTable, usersTable } from "@/database/tables";

export { default as countryCodes } from "./country-codes";

export const handleDbError = ({ message }: { message: string }) => {
	console.log(message);

	if (message.includes("SQLITE_CONSTRAINT")) {
		let msg: string;
		let error;

		if (message.includes("UNIQUE")) {
			const field = message.split(".")[1].split(": ")[0];
			msg = `This ${field} has already been taken`;
			error = { field, code: "UNIQUE_CONSTRAINT_ERROR" };
		} else {
			msg = message.split(": ")[1];
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
	const adapter = new DrizzleSQLiteAdapter(db, sessionsTable, usersTable);

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
		}),
	});
}

declare module "lucia" {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>;
		DatabaseUserAttributes: {
			email: string;
			username: string;
			name: string;
			profileImage: string;
		};
	}
}
