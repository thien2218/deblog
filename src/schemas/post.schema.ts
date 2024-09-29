import {
	array,
	check,
	date,
	InferOutput,
	maxLength,
	minLength,
	nonEmpty,
	nullable,
	object,
	optional,
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
	post: object({ ...PostInfoSchema.entries, content: string() }),
	author: object({
		...UserInfoSchema.entries,
		role: nullable(string()),
		country: nullable(string()),
	}),
});

export const GetPostsSchema = array(
	object({
		post: PostInfoSchema,
		author: UserInfoSchema,
	})
);

export const UpdatePostMetadataSchema = pipe(
	object({
		title: optional(
			pipe(
				string(),
				minLength(3, "Title must be at least 3 characters long"),
				maxLength(120, "Title must be at most 120 characters long")
			)
		),
		description: optional(
			pipe(
				string(),
				minLength(10, "Summary must be at least 10 characters long"),
				maxLength(500, "Summary must be at most 500 characters long")
			)
		),
	}),
	check(
		(v) => Object.keys(v).length > 0,
		"At least one field must be provided to update the post"
	)
);

export const UpdatePostContentSchema = object({
	content: pipe(
		string(),
		nonEmpty("Blog content cannot be empty"),
		maxLength(64 * 1024, "Blog content cannot be too long")
	),
});

export type ReadPost = InferOutput<typeof ReadPostSchema>;
export type GetPosts = InferOutput<typeof GetPostsSchema>;
export type UpdatePost = InferOutput<typeof UpdatePostMetadataSchema>;
