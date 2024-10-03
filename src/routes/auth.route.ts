import { AppEnv } from "@/context";
import { Hono } from "hono";
import { LoginSchema, SignupSchema } from "@/schemas";
import { compare, hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { auth, unauth, valibot } from "@/middlewares";
import { insertUser, findLoginUser } from "@/database/queries";

const authRoutes = new Hono<AppEnv>().basePath("/auth");

// Signup a new user
authRoutes.post("/signup", unauth, valibot("json", SignupSchema), async (c) => {
	const { password, ...rest } = c.req.valid("json");
	const lucia = c.get("lucia");
	const encryptedPassword = await hash(password, 11);
	const userId = nanoid(25);

	await insertUser(c.get("db"), { encryptedPassword, ...rest, id: userId });

	const session = await lucia.createSession(userId, {});
	const serializedCookie = lucia.createSessionCookie(session.id).serialize();

	c.header("Set-Cookie", serializedCookie, { append: true });
	c.header("Location", "/home", { append: true });

	return c.text("User signed up successfully", 201);
});

// Login a user
authRoutes.post("/login", unauth, valibot("json", LoginSchema), async (c) => {
	const { identifier, password } = c.req.valid("json");
	const lucia = c.get("lucia");

	const user = await findLoginUser(c.get("db"), identifier);

	if (!user) {
		return c.text("Incorrect email/username or password", 400);
	}
	if (!user.encryptedPassword) {
		return c.text("Incorrect login method", 400);
	}
	if (!(await compare(password, user.encryptedPassword))) {
		return c.text("Incorrect email/username or password", 400);
	}

	const session = await lucia.createSession(user.id, {});
	const serializedCookie = lucia.createSessionCookie(session.id).serialize();

	c.header("Set-Cookie", serializedCookie, { append: true });
	c.header("Location", "/home", { append: true });

	return c.text("User logged in successfully");
});

// Logout a user
authRoutes.post("/logout", auth, async (c) => {
	const session = c.get("session");
	const lucia = c.get("lucia");

	await lucia.invalidateSession(session.id);

	c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
		append: true,
	});
	c.header("Location", "/login", { append: true });

	return c.text("User successfully logged out");
});

// Get the current user's basic info
authRoutes.get("/me", auth, async (c) => {
	const user = c.get("user");

	return c.json(
		{
			state: "success",
			message: "User info fetched successfully",
			output: user,
		},
		200
	);
});

export default authRoutes;
