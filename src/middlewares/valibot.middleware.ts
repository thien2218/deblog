import { Input, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import {
	GenericSchema,
	GenericSchemaAsync,
	InferOutput,
	safeParseAsync,
} from "valibot";

type Targets<P extends string = string> = {
	json: any;
	query: Record<string, string | string[]>;
	param: Record<P, P extends `${infer _}?` ? string | undefined : string>;
};

const jsonRegex =
	/^application\/([a-z-\.]+\+)?json(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;
const multipartRegex =
	/^multipart\/form-data(;\s?boundary=[a-zA-Z0-9'"()+_,\-./:=?]+)?$/;
const urlencodedRegex =
	/^application\/x-www-form-urlencoded(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;

const valibot = <
	T extends GenericSchema | GenericSchemaAsync,
	Target extends keyof Targets,
	I extends Input = { out: { [K in Target]: InferOutput<T> } }
>(
	target: Target,
	schema: T
): MiddlewareHandler<any, string, I> => {
	return async (c, next) => {
		const contentType = c.req.header("Content-Type");
		let value: object = {};

		switch (target) {
			case "json":
				if (!contentType) break;

				if (jsonRegex.test(contentType)) {
					value = await c.req.json().catch(() => {
						throw new HTTPException(400, {
							message: "Malformed JSON in request body",
						});
					});
				} else if (
					multipartRegex.test(contentType) ||
					urlencodedRegex.test(contentType)
				) {
					value = await c.req.parseBody().catch(() => {
						throw new HTTPException(400, {
							message: "Malformed JSON in request body",
						});
					});
				}

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

		c.req.addValidatedData(target, result.output as object);
		await next();
	};
};

export default valibot;
