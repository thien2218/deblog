import { Lucia } from "lucia";
import { D1Adapter } from "@lucia-auth/adapter-sqlite";
import { StatusCode } from "hono/utils/http-status";

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

export const handleUniqueConstraintErr = ({
	message,
}: {
	message: string;
}): { message: string; status: StatusCode } => {
	if (message.includes("UNIQUE")) {
		const field = message.split(".")[1].split(": ")[0];

		return {
			message: `${field.charAt(0).toUpperCase()}${field.slice(
				1
			)} already exists`,
			status: 400,
		};
	}

	return { message, status: 500 };
};

declare module "lucia" {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>;
	}
}
