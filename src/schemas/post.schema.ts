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
	string,
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
	post: object({ ...PostInfoSchema.entries, content: optional(string(), "") }),
	author: object({
		...UserInfoSchema.entries,
		role: nullable(string()),
		country: nullable(string()),
	}),
});

export const GetPostSchema = object({
	post: PostInfoSchema,
	author: UserInfoSchema,
});

export const GetPostsSchema = array(GetPostSchema);

export const UpdatePostSchema = pipe(
	partial(
		object({
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
			content: pipe(
				string(),
				minLength(10, "Content must be at least 10 characters long"),
				maxLength(64 * 1024, "Content cannot be too long")
			),
		})
	),
	check(
		(v) => Object.keys(v).length > 0,
		"At least one field must be provided to update the post"
	)
);

export type ReadPost = InferOutput<typeof ReadPostSchema>;
export type GetPost = InferOutput<typeof GetPostSchema>;
export type GetPosts = GetPost[];
export type UpdatePost = InferOutput<typeof UpdatePostSchema>;
