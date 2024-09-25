import {
	any,
	object,
	optional,
	picklist,
	pipe,
	string,
	transform,
} from "valibot";

export * from "./auth.schema";
export * from "./page-query.schema";
export * from "./post.schema";

export const ResponseSchema = pipe(
	object({
		state: picklist(["success", "error", "pending", "queued", "blocked"]),
		message: string(),
		payload: optional(any()),
		error: optional(any()),
	}),
	transform((values) => {
		if (!values.payload) {
			values.payload = null;
		}
		if (!values.error) {
			values.error = null;
		}
		return values;
	})
);
