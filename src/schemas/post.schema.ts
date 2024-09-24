import { date, InferOutput, object, string } from "valibot";

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

export type SelectPost = InferOutput<typeof SelectPostSchema>;
