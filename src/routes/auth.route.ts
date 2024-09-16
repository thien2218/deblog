import { Context } from "@/context";
import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import { LoginSchema, SignupSchema } from "@/schemas";
import { drizzle } from "drizzle-orm/d1";
import { profilesTable, usersTable } from "@/database/tables";
import bcrypt from "bcryptjs";
import { initializeLucia } from "@/services";
import { nanoid } from "nanoid";
import { capitalize } from "@/utils";

export const authRoutes = new Hono<Context>().basePath("/auth");

// authRoutes.post("/login", vValidator("json", LoginSchema), (c) => {
// 	const data = c.req.valid("json");

// 	return c.json(
// 		{
// 			message: "Login successful",
// 			statusCode: 200,
// 		},
// 		200
// 	);
// });

authRoutes.post("/signup", vValidator("form", SignupSchema), async (c) => {
	const { password, name, ...rest } = c.req.valid("form");
	const db = drizzle(c.env.DB);
	const lucia = initializeLucia(c.env.DB);
	const encryptedPassword = await bcrypt.hash(password, 12);
	const userId = nanoid(25);

	try {
		await db.batch([
			db
				.insert(usersTable)
				.values({ id: userId, ...rest, encryptedPassword }),
			db.insert(profilesTable).values({ userId, name }),
		]);
	} catch (error: any) {
		if ((error.message as string).includes("UNIQUE")) {
			const field = (error.message as string).split(".")[1].split(": ")[0];

			return c.json(
				{
					message: `${capitalize(field)} already exists`,
					error: "Bad Request",
				},
				400
			);
		}

		return c.json({ message: "Database error", error: error.message }, 500);
	}

	const session = await lucia.createSession(userId, {});
	const serializedCookie = lucia.createSessionCookie(session.id).serialize();

	c.header("Set-Cookie", serializedCookie, { append: true });
	c.header("Location", "/home", { append: true });

	return c.json({ message: "User successfully created" }, 201);
});
