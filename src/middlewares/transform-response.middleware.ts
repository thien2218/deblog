import { ResponseSchema } from "@/schemas";
import { MiddlewareHandler } from "hono";
import { parse } from "valibot";

const transformResponse: MiddlewareHandler = async (c, next) => {
	await next();

	const contentType = c.res.headers.get("content-type");

	if (!contentType?.includes("application/json")) {
		const payload = await c.res.json();
		const parsedPayload = parse(ResponseSchema, payload);
		c.res = new Response(JSON.stringify(parsedPayload), c.res);
	}
};

export default transformResponse;
