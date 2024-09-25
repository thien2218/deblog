import { AppEnv } from "@/context";
import { createMiddleware } from "hono/factory";
import { Session, User } from "lucia";

interface AuthEnv extends AppEnv {
	Variables: {
		user: User;
		session: Session;
	} & AppEnv["Variables"];
}

const auth = createMiddleware<AuthEnv>(async (c, next) => {
	const session = c.get("session");

	if (!session) {
		return c.json(
			{
				state: "blocked",
				message: "User is not logged in",
			},
			401
		);
	}

	return next();
});

export default auth;
