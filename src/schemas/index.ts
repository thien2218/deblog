import { any, check, object, optional, picklist, pipe, string } from "valibot";

export * from "./auth.schema";
export * from "./query.schema";
export * from "./post.schema";
export * from "./user.schema";
export * from "./comment.schema";
export * from "./series.schema";
export * from "./tag.schema";
export * from "./reaction.schema";

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
