import { AppEnv } from "@/context";
import { Hono } from "hono";
import { LoginSchema, SignupSchema } from "@/schemas";
import { drizzle } from "drizzle-orm/d1";
import { usersTable } from "@/database/tables";
import { compare, hash } from "bcryptjs";
import { handleDbError, initializeLucia } from "@/utils";
import { nanoid } from "nanoid";
import { auth, unauth, valibot } from "@/middlewares";
import { eq, or, sql } from "drizzle-orm";

const authRoutes = new Hono<AppEnv>().basePath("/auth");

authRoutes.post("/signup", unauth, valibot("json", SignupSchema), async (c) => {
	const { password, ...rest } = c.req.valid("json");
	const db = drizzle(c.env.DB);
	const lucia = initializeLucia(c.env.DB);
	const encryptedPassword = await hash(password, 11);
	const userId = nanoid(25);

	const query = db
		.insert(usersTable)
		.values({
			id: sql.placeholder("id"),
			name: sql.placeholder("name"),
			email: sql.placeholder("email"),
			username: sql.placeholder("username"),
			encryptedPassword: sql.placeholder("encryptedPassword"),
		})
		.prepare();

	try {
		await query.execute({ encryptedPassword, ...rest, id: userId });
	} catch (err: any) {
		const { message, status } = handleDbError(err);
		return c.json({ message }, status);
	}

	const session = await lucia.createSession(userId, {});
	const serializedCookie = lucia.createSessionCookie(session.id).serialize();

	c.header("Set-Cookie", serializedCookie, { append: true });
	c.header("Location", "/home", { append: true });

	return c.json(
		{ state: "success", message: "User signed up successfully" },
		201
	);
});

authRoutes.post("/login", unauth, valibot("json", LoginSchema), async (c) => {
	const { identifier, password } = c.req.valid("json");
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

	const user = await query.get({ identifier });

	if (!user) {
		return c.json(
			{ state: "error", message: "Incorrect email/username or password" },
			400
		);
	}
	if (!user.encryptedPassword) {
		return c.json({ message: "Incorrect login method", state: "error" }, 400);
	}
	if (!(await compare(password, user.encryptedPassword))) {
		return c.json(
			{ state: "error", message: "Incorrect email/username or password" },
			400
		);
	}

	const session = await lucia.createSession(user.id, {});
	const serializedCookie = lucia.createSessionCookie(session.id).serialize();

	c.header("Set-Cookie", serializedCookie, { append: true });
	c.header("Location", "/home", { append: true });

	return c.json({ message: "User successfully logged in", state: "success" });
});

authRoutes.post("/logout", auth, async (c) => {
	const session = c.get("session");
	const lucia = initializeLucia(c.env.DB);
	await lucia.invalidateSession(session.id);

	c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
		append: true,
	});
	c.header("Location", "/login", { append: true });

	return c.json({ message: "User successfully logged out", state: "success" });
});

export default authRoutes;
