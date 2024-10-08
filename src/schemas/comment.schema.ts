import {
	InferOutput,
	length,
	maxLength,
	nanoid,
	nonEmpty,
	object,
	pipe,
	regex,
	string,
} from "valibot";

export const CommentSchema = object({
	content: pipe(
		string(),
		nonEmpty("Comment cannot be empty"),
		maxLength(4000, "Comment cannot exceed 4000 characters")
	),
});

export const ReplySchema = object({
	content: pipe(
		...CommentSchema.entries.content.pipe,
		regex(
			/^(?!.*\|\@[0-9]\|).+$/,
			"Replies are not allowed to contain this sequence: |@<number>|"
		)
	),
});

export type Comment = InferOutput<typeof CommentSchema>;
