import { array, maxLength, nonEmpty, pipe, regex, string } from "valibot";

export const TagsSchema = array(
	pipe(
		string(),
		nonEmpty("Tag must not be empty"),
		maxLength(30, "Tag must be at most 30 characters long"),
		regex(
			/^[a-zA-Z0-9\-\.'’]+$/,
			"Tag can only contain letters, numbers, hyphens, apostrophes, and periods"
		)
	)
);
