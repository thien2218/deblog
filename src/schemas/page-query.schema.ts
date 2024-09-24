import {
	check,
	maxValue,
	minValue,
	number,
	object,
	pipe,
	transform,
} from "valibot";

export const PageQuerySchema = pipe(
	object({
		page: pipe(number(), minValue(1)),
		limit: pipe(
			number(),
			minValue(5),
			maxValue(100),
			check((l) => l % 5 === 0, "Limit must be a multiple of 5")
		),
	}),
	transform(({ page, limit }) => ({ offset: (page - 1) * limit, limit }))
);
