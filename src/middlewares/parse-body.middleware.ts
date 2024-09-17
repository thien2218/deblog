import { createMiddleware } from "hono/factory";

const parseBody = createMiddleware(async (c, next) => {
	const contentType = c.req.header("Content-Type");

	if (contentType?.includes("json")) {
		const body = await c.req.json();
		c.set("parsedBody", body);
	} else if (
		contentType?.includes("form-data") ||
		contentType?.includes("x-www-form-urlencoded")
	) {
		const body = await c.req.parseBody();
		c.set("parsedBody", body);
	}

	await next();
});

export default parseBody;
