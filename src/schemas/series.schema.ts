import {
	array,
	InferOutput,
	integer,
	length,
	maxLength,
	minLength,
	minValue,
	nanoid,
	nonEmpty,
	number,
	object,
	optional,
	partial,
	pipe,
	string,
} from "valibot";

export const CreateSeriesSchema = object({
	title: pipe(
		string(),
		minLength(5, "Series title must be at least 5 characters long"),
		maxLength(100, "Series title must be at most 100 characters long")
	),
	description: optional(
		pipe(
			string(),
			nonEmpty("Series description must not be empty"),
			maxLength(
				500,
				"Series description must be at most 500 characters long"
			)
		)
	),
});

export const UpdateSeriesSchema = partial(CreateSeriesSchema);

export const PostIdsSchema = object({
	postIds: pipe(
		array(
			pipe(
				string(),
				nanoid("Invalid post ID"),
				length(25, "Invalid post ID")
			)
		),
		nonEmpty("List of post IDs must not be empty")
	),
});

export const UpdateSeriesPostsSchema = object({
	postIds: array(
		pipe(string(), nanoid("Invalid post ID"), length(25, "Invalid post ID"))
	),
	minOrder: pipe(
		number("Post min order must be a number"),
		integer("Post min order must be an integer"),
		minValue(1, "Post min order must be at least 1")
	),
});

export type CreateSeries = InferOutput<typeof CreateSeriesSchema>;
export type UpdateSeries = InferOutput<typeof UpdateSeriesSchema>;
export type PostIds = InferOutput<typeof PostIdsSchema>;
export type UpdateSeriesPosts = InferOutput<typeof UpdateSeriesPostsSchema>;
