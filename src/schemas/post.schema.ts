import {
	check,
	InferOutput,
	maxLength,
	minLength,
	nonEmpty,
	object,
	optional,
	pipe,
	string,
} from "valibot";

export const UpdatePostMetadataSchema = pipe(
	object({
		title: optional(
			pipe(
				string(),
				minLength(3, "Title must be at least 3 characters long"),
				maxLength(120, "Title must be at most 120 characters long")
			)
		),
		description: optional(
			pipe(
				string(),
				minLength(10, "Summary must be at least 10 characters long"),
				maxLength(500, "Summary must be at most 500 characters long")
			)
		),
	}),
	check(
		(v) => Object.keys(v).length > 0,
		"At least one field must be provided to update the post"
	)
);

export const UpdatePostContentSchema = object({
	content: pipe(
		string(),
		nonEmpty("Blog content cannot be empty"),
		maxLength(60 * 1024, "Blog content cannot be too long")
	),
});

export type UpdatePostMetadata = InferOutput<typeof UpdatePostMetadataSchema>;
export type UpdatePostContent = InferOutput<typeof UpdatePostContentSchema>;
