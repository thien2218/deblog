import { maxLength, nonEmpty, object, pipe, string } from "valibot";

export const CommentSchema = object({
	content: pipe(
		string(),
		nonEmpty("Comment cannot be empty"),
		maxLength(5000, "Comment cannot exceed 5000 characters")
	),
});
