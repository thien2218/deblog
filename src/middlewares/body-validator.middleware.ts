import { Input, MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import {
	GenericSchema,
	GenericSchemaAsync,
	InferOutput,
	safeParseAsync,
} from "valibot";

const bodyValidator = <
	T extends GenericSchema | GenericSchemaAsync,
	Out = InferOutput<T>,
	I extends Input = { out: { json: Out } }
>(
	schema: T
): MiddlewareHandler<any, string, I> => {
	return createMiddleware(async (c, next) => {
		const body = c.get("parsedBody");

		if (!body) {
			return c.json({ message: "Request body is required" }, 400);
		}

		const result = await safeParseAsync(schema, body);

		if (!result.success) {
			return c.json({ message: result.issues[0].message }, 400);
		}

		c.set("parsedBody", undefined);
		c.req.addValidatedData("json", result.output as object);
		await next();
	});
};

export default bodyValidator;
