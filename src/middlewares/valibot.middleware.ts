import { Input, MiddlewareHandler, ValidationTargets } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import {
	GenericSchema,
	GenericSchemaAsync,
	InferOutput,
	safeParseAsync,
} from "valibot";

type Target = "body" | "query" | "param";
type HonoTarget = "json" | "query" | "param";

const jsonRegex =
	/^application\/([a-z-\.]+\+)?json(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;
const multipartRegex =
	/^multipart\/form-data(;\s?boundary=[a-zA-Z0-9'"()+_,\-./:=?]+)?$/;
const urlencodedRegex =
	/^application\/x-www-form-urlencoded(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;

const valibot = <
	T extends GenericSchema | GenericSchemaAsync,
	I extends Input = { out: { [K in HonoTarget]: InferOutput<T> } }
>(
	target: Target,
	schema: T
): MiddlewareHandler<any, string, I> => {
	return createMiddleware(async (c, next) => {
		const contentType = c.req.header("Content-Type");
		let value: object = {};
		let honoTarget: HonoTarget = target as HonoTarget;

		switch (target) {
			case "body":
				if (!contentType) break;

				if (jsonRegex.test(contentType)) {
					try {
						value = await c.req.json();
					} catch {
						throw new HTTPException(400, {
							message: "Malformed JSON in request body",
						});
					}
				} else if (
					multipartRegex.test(contentType) ||
					urlencodedRegex.test(contentType)
				) {
					try {
						value = await c.req.parseBody();
					} catch {
						throw new HTTPException(400, {
							message: "Malformed form data in request body",
						});
					}
				}

				honoTarget = "json";
				break;
			case "query":
				value = Object.fromEntries(
					Object.entries(c.req.queries()).map(([k, v]) => {
						return v.length === 1 ? [k, v[0]] : [k, v];
					})
				);
				break;
			case "param":
				value = c.req.param() as Record<string, string>;
				break;
			default:
				throw new HTTPException(500, { message: "Invalid target" });
		}

		const result = await safeParseAsync(schema, value);

		if (!result.success) {
			const issue = result.issues[0];

			return c.json(
				{
					message: issue.message,
					target,
					received: issue.input,
					field: issue.path?.[0].key ?? null,
					expected: issue.expected,
				},
				400
			);
		}

		c.req.addValidatedData(honoTarget, result.output as object);
		await next();
	});
};

export default valibot;
