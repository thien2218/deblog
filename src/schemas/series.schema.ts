import {
	InferOutput,
	maxLength,
	minLength,
	nonEmpty,
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

export type CreateSeries = InferOutput<typeof CreateSeriesSchema>;
export type UpdateSeries = InferOutput<typeof UpdateSeriesSchema>;
