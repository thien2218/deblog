import { any, check, object, optional, picklist, pipe, string } from "valibot";

export * from "./auth.schema";
export * from "./page-query.schema";
export * from "./post.schema";

export const JSONResponseSchema = pipe(
	object({
		state: picklist(["success", "error", "blocked"]),
		message: string(),
		output: optional(any()),
		error: optional(any()),
	}),
	check(
		(values) => !values.output || !values.error,
		"Output and error cannot be present at the same time"
	)
);
