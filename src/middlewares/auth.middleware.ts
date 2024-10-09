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
	const user = c.get("user");

	if (!user || !user.hasOnboarded) {
		return c.text("User is not logged in", 401);
	}

	return next();
});

export default auth;
