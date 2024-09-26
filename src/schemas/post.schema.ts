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
import { UserInfoSchema } from "./user.schema";

const PostInfoSchema = object({
	id: string(),
	title: string(),
	description: nullable(string()),
	createdAt: date(),
	updatedAt: date(),
});

export const ReadPostSchema = object({
	post: object({ ...PostInfoSchema.entries, markdownUrl: string() }),
	author: object({
		...UserInfoSchema.entries,
		role: string(),
		country: string(),
	}),
});

export const GetPostSchema = object({
	post: PostInfoSchema,
	author: UserInfoSchema,
});

export const GetPostsSchema = array(GetPostSchema);

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

export type ReadPost = InferOutput<typeof ReadPostSchema>;
export type GetPost = InferOutput<typeof GetPostSchema>;
export type GetPosts = InferOutput<typeof GetPostsSchema>;
export type CreatePost = InferOutput<typeof CreatePostSchema>;
export type UpdatePost = InferOutput<typeof UpdatePostSchema>;
