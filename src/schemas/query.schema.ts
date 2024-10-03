import {
	check,
	maxValue,
	minValue,
	object,
	pipe,
	transform,
	string,
	InferOutput,
	optional,
} from "valibot";

export const PageQuerySchema = pipe(
	object({
		page: pipe(
			string(),
			check(
				(p) => Number.isInteger(parseFloat(p)),
				"Page must be an integer"
			),
			transform((p) => parseInt(p)),
			minValue(1, "Page's value must be at least 1")
		),
		limit: pipe(
			optional(string(), "20"),
			check(
				(l) => Number.isInteger(parseFloat(l)),
				"Limit must be an integer"
			),
			transform((l) => parseInt(l)),
			minValue(5, "Limit's value must be at least 5"),
			maxValue(100, "Limit's value must be at most 100"),
			check((l) => l % 5 === 0, "Limit must be a multiple of 5")
		),
	}),
	transform(({ page, limit }) => ({ offset: (page - 1) * limit, limit }))
);

export type PageQuery = InferOutput<typeof PageQuerySchema>;
