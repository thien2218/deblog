import { countryCodes } from "@/utils";
import {
	check,
	InferOutput,
	maxLength,
	minLength,
	object,
	partial,
	picklist,
	pipe,
	startsWith,
	string,
	url,
} from "valibot";

export const UpdateProfileSchema = pipe(
	partial(
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
			country: picklist(countryCodes, "Provided country code is invalid"),
			profileImage: pipe(
				string(),
				url("Profile image must be a valid URL"),
				startsWith("https://", "Profile image URL must be secure")
			),
		})
	),
	check((v) => Object.keys(v).length > 0, "No fields to update")
);

export type UpdateProfile = InferOutput<typeof UpdateProfileSchema>;
