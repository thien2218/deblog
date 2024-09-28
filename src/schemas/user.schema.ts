import { date, InferOutput, nullable, object, string } from "valibot";

export const UserInfoSchema = object({
	username: string(),
	name: string(),
	profileImage: nullable(string()),
});

export const GetUserSchema = object({
	id: string(),
	...UserInfoSchema.entries,
	title: nullable(string()),
	bio: nullable(string()),
	website: nullable(string()),
	country: nullable(string()),
	createdAt: date(),
	updatedAt: date(),
});

export type GetUser = InferOutput<typeof GetUserSchema>;
