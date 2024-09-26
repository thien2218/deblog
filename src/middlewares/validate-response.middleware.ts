import { JSONResponseSchema } from "@/schemas";
import { MiddlewareHandler } from "hono";
import { parse } from "valibot";
import { jsonRegex } from "./valibot.middleware";

const validateResponse: MiddlewareHandler = async (c, next) => {
	await next();
	const contentType = c.res.headers.get("content-type");

	if (contentType && jsonRegex.test(contentType)) {
		const payload = await c.res.json();
		const parsedPayload = parse(JSONResponseSchema, payload);
		c.res = new Response(JSON.stringify(parsedPayload), c.res);
	}
};

export default validateResponse;
