import { AppEnv } from "@/context";
import { Hono } from "hono";
import { LoginSchema, SignupSchema } from "@/schemas";
import { drizzle } from "drizzle-orm/d1";
import { profilesTable, usersTable } from "@/database/tables";
import { compare, hash } from "bcryptjs";
import { initializeLucia } from "@/utils";
import { nanoid } from "nanoid";
import { capitalize } from "@/utils";
import { valibotValidator } from "@/middlewares";
import { eq, or, sql } from "drizzle-orm";

export const authRoutes = new Hono<AppEnv>().basePath("/auth");

authRoutes.post("/signup", valibotValidator(SignupSchema), async (c) => {
	const { password, name, ...rest } = c.req.valid("json");
	const db = drizzle(c.env.DB);
	const lucia = initializeLucia(c.env.DB);
	const encryptedPassword = await hash(password, 12);
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

authRoutes.post("/login", valibotValidator(LoginSchema), async (c) => {
	const data = c.req.valid("json");
	const db = drizzle(c.env.DB);
	const lucia = initializeLucia(c.env.DB);

	const query = db
		.select({
			id: usersTable.id,
			encryptedPassword: usersTable.encryptedPassword,
		})
		.from(usersTable)
		.where(
			or(
				eq(usersTable.email, sql.placeholder("identifier")),
				eq(usersTable.username, sql.placeholder("identifier"))
			)
		)
		.prepare();

	const user = await query.get({ identifier: data.identifier });

	if (!user) {
		return c.json(
			{ message: "User does not exist", error: "Bad Request" },
			400
		);
	}
	if (!user.encryptedPassword) {
		return c.json(
			{ message: "Incorrect login method", error: "Bad Request" },
			400
		);
	}
	if (!(await compare(data.password, user.encryptedPassword))) {
		return c.json(
			{ message: "Incorrect password", error: "Bad Request" },
			400
		);
	}

	const session = await lucia.createSession(user.id, {});
	const serializedCookie = lucia.createSessionCookie(session.id).serialize();

	c.header("Set-Cookie", serializedCookie, { append: true });
	c.header("Location", "/home", { append: true });

	return c.json({ message: "User successfully logged in" });
});

authRoutes.post("/logout", async (c) => {
	const session = c.get("session");

	if (!session) {
		return c.json(
			{ message: "User is not logged in", error: "Bad Request" },
			400
		);
	}

	const lucia = initializeLucia(c.env.DB);
	await lucia.invalidateSession(session.id);

	c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
		append: true,
	});
	c.header("Location", "/login", { append: true });

	return c.json({ message: "User successfully logged out" });
});
