import { AppEnv } from "@/context";
import { createMiddleware } from "hono/factory";
import { Session, User } from "lucia";

interface AuthenticatedEnv extends AppEnv {
	Variables: {
		user: User;
		session: Session;
	} & AppEnv["Variables"];
	Bindings: AppEnv["Bindings"];
}

const authenticated = createMiddleware<AuthenticatedEnv>(async (c, next) => {
	const session = c.get("session");

	if (!session) {
		return c.json(
			{ error: "Unauthorized", message: "User is not authenticated" },
			401
		);
	}

	return next();
});

export default authenticated;
