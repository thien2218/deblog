import { date, InferOutput, object, string } from "valibot";

export const UserInfoSchema = object({
	username: string(),
	name: string(),
	profileImage: string(),
});

export const GetUserSchema = object({
	id: string(),
	...UserInfoSchema.entries,
	title: string(),
	bio: string(),
	website: string(),
	country: string(),
	createdAt: date(),
	updatedAt: date(),
});

export type GetUser = InferOutput<typeof GetUserSchema>;
