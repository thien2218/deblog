import { countryCodes } from "@/utils";
import {
	date,
	InferOutput,
	maxLength,
	minLength,
	nullable,
	object,
	partial,
	picklist,
	pipe,
	startsWith,
	string,
	url,
} from "valibot";

export const UserInfoSchema = object({
	username: string(),
	name: string(),
	profileImage: nullable(string()),
});

export const GetUserSchema = object({
	id: string(),
	...UserInfoSchema.entries,
	role: nullable(string()),
	bio: nullable(string()),
	website: nullable(string()),
	country: nullable(string()),
	createdAt: date(),
	updatedAt: date(),
});

export const UpdateProfileSchema = partial(
	object({
		name: pipe(
			string(),
			minLength(3, "Name must be at least 3 characters long"),
			maxLength(50, "Name must be at most 50 characters long")
		),
		role: pipe(
			string(),
			minLength(3, "Title must be at least 3 characters long"),
			maxLength(100, "Title must be at most 100 characters long")
		),
		bio: pipe(
			string(),
			minLength(3, "Bio must be at least 3 characters long"),
			maxLength(500, "Bio must be at most 500 characters long")
		),
		website: pipe(
			string(),
			url("Website must be a valid URL"),
			startsWith("https://", "Website URL must be secure")
		),
		country: picklist(countryCodes),
		profileImage: pipe(
			string(),
			url("Profile image must be a valid URL"),
			startsWith("https://", "Profile image URL must be secure")
		),
	})
);

export type GetUser = InferOutput<typeof GetUserSchema>;
export type UpdateProfile = InferOutput<typeof UpdateProfileSchema>;
