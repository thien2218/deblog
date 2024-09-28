import { Lucia } from "lucia";
import { D1Adapter } from "@lucia-auth/adapter-sqlite";
import { HTTPException } from "hono/http-exception";

export function initializeLucia(d1: D1Database) {
	const adapter = new D1Adapter(d1, {
		user: "users",
		session: "sessions",
	});

	return new Lucia(adapter, {
		sessionCookie: {
			attributes: {
				secure: process.env.NODE_ENV === "production",
			},
		},
		getUserAttributes: (attr) => {
			return {
				id: attr.id,
				username: attr.username,
				email: attr.email,
				profileImage: attr.profileImage,
			};
		},
	});
}

export const handleDbError = ({ message }: { message: string }) => {
	if (message.includes("UNIQUE")) {
		const field = message.split(".")[1].split(": ")[0];

		throw new HTTPException(400, {
			res: new Response(
				JSON.stringify({
					state: "error",
					message: `This ${field} already been taken`,
					error: { field, code: "UNIQUE_CONSTRAINT_ERROR" },
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

declare module "lucia" {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>;
		DatabaseUserAttributes: {
			id: string;
			username: string;
			email: string;
			profileImage: string;
		};
	}
}
