import {
	array,
	check,
	date,
	InferOutput,
	maxLength,
	minLength,
	nullable,
	object,
	optional,
	partial,
	pipe,
	startsWith,
	string,
	url,
} from "valibot";

const AuthorSchema = object({
	username: string(),
	name: string(),
	profileImage: string(),
	role: string(),
	country: string(),
});

export const PostSchema = object({
	id: string(),
	title: string(),
	description: nullable(string()),
	createdAt: date(),
	updatedAt: date(),
});

export const SelectPostsSchema = array(
	object({ post: PostSchema, author: AuthorSchema })
);

export const SelectPostSchema = object({
	post: object({ ...PostSchema.entries, markdownUrl: string() }),
	author: AuthorSchema,
});

export const CreatePostSchema = object({
	title: pipe(
		string(),
		minLength(3, "Title must be at least 3 characters long"),
		maxLength(120, "Title must be at most 120 characters long")
	),
	description: optional(
		pipe(
			string(),
			minLength(10, "Summary must be at least 10 characters long"),
			maxLength(500, "Summary must be at most 500 characters long")
		)
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

export type SelectPosts = InferOutput<typeof SelectPostsSchema>;
export type SelectPost = InferOutput<typeof SelectPostSchema>;
export type CreatePost = InferOutput<typeof CreatePostSchema>;
export type UpdatePost = InferOutput<typeof UpdatePostSchema>;
