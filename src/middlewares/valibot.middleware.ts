import { AppEnv } from "@/context";
import { Input, MiddlewareHandler, ValidationTargets } from "hono";
import { createMiddleware } from "hono/factory";
import {
	GenericSchema,
	GenericSchemaAsync,
	InferInput,
	InferOutput,
	safeParseAsync,
} from "valibot";

type HasUndefined<T> = undefined extends T ? true : false;

const valibotValidator = <
	T extends GenericSchema | GenericSchemaAsync,
	Target extends keyof ValidationTargets,
	In = InferInput<T>,
	Out = InferOutput<T>,
	I extends Input = {
		in: HasUndefined<In> extends true
			? {
					[K in Target]?: K extends "json"
						? In
						: HasUndefined<keyof ValidationTargets[K]> extends true
						? { [K2 in keyof In]?: ValidationTargets[K][K2] }
						: { [K2 in keyof In]: ValidationTargets[K][K2] };
			  }
			: {
					[K in Target]: K extends "json"
						? In
						: HasUndefined<keyof ValidationTargets[K]> extends true
						? { [K2 in keyof In]?: ValidationTargets[K][K2] }
						: { [K2 in keyof In]: ValidationTargets[K][K2] };
			  };
		out: { [K in Target]: Out };
	},
	V extends I = I
>(
	schema: T
): MiddlewareHandler<AppEnv, string, V> => {
	return createMiddleware(async (c, next) => {
		const body = c.get("parsedBody");

		if (!body) {
			return c.json(
				{
					message: "Request body is required",
					error: "Bad Request",
				},
				400
			);
		}

		const result = await safeParseAsync(schema, body);

		if (!result.success) {
			return c.json(
				{
					message: result.issues[0].message,
					error: "Bad Request",
				},
				400
			);
		}

		c.set("parsedBody", undefined);
		c.req.addValidatedData("json", result.output as object);
		await next();
	});
};

export default valibotValidator;
