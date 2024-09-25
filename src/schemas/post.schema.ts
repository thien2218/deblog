import {
	check,
	date,
	InferOutput,
	maxLength,
	minLength,
	object,
	partial,
	pipe,
	startsWith,
	string,
	url,
} from "valibot";

export const SelectPostSchema = object({
	post: object({
		id: string(),
		title: string(),
		summary: string(),
		markdownUrl: string(),
		createdAt: date(),
		updatedAt: date(),
	}),
	author: object({
		username: string(),
		name: string(),
		profileImage: string(),
		title: string(),
		country: string(),
	}),
});

export const CreatePostSchema = object({
	title: pipe(
		string(),
		minLength(3, "Title must be at least 3 characters long"),
		maxLength(120, "Title must be at most 120 characters long")
	),
	summary: pipe(
		string(),
		minLength(10, "Summary must be at least 10 characters long"),
		maxLength(300, "Summary must be at most 300 characters long")
	),
	markdownUrl: pipe(
		string(),
		url("Markdown URL must be a valid URL"),
		startsWith("https://", "Markdown URL must be secure (https)")
	),
});

export const UpdatePostSchema = pipe(
	partial(CreatePostSchema),
	check(
		(v) => Object.keys(v).length > 0,
		"At least one field must be provided to update the post"
	)
);

export type SelectPost = InferOutput<typeof SelectPostSchema>;
export type CreatePost = InferOutput<typeof CreatePostSchema>;
export type UpdatePost = InferOutput<typeof UpdatePostSchema>;
