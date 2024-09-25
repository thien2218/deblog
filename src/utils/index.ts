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
	});
}

export const handleDbError = ({ message }: { message: string }) => {
	if (message.includes("UNIQUE")) {
		const field = message.split(".")[1].split(": ")[0];

		throw new HTTPException(400, {
			message: `${field.charAt(0).toUpperCase()}${field.slice(
				1
			)} already exists`,
		});
	}

	throw new HTTPException(500, { message });
};

declare module "lucia" {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>;
	}
}
