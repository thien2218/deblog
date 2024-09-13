import { Context } from "@/context";
import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import { LoginSchema, SignupSchema } from "@/schemas";
import { drizzle } from "drizzle-orm/d1";
import { profilesTable, usersTable } from "@/database/tables";
import bcrypt from "bcryptjs";
import { initializeLucia } from "@/services/auth.service";
import { nanoid } from "nanoid";

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

	// await db.transaction(async (txn) => {
	// 	await txn
	// 		.insert(usersTable)
	// 		.values({ id: userId, ...rest, encryptedPassword })
	// 		.execute();

	// 	await txn.insert(profilesTable).values({ userId, name }).execute();
	// });

	await db
		.insert(usersTable)
		.values({ id: userId, ...rest, encryptedPassword })
		.execute();
	await db.insert(profilesTable).values({ userId, name }).execute();

	const session = await lucia.createSession(userId, {});

	c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
		append: true,
	});
	c.header("Location", "/", { append: true });

	return c.json(
		{
			message: "User successfully created",
			statusCode: 201,
		},
		201
	);
});
