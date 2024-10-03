import { countryCodes } from "@/utils";
import {
	check,
	InferOutput,
	length,
	maxLength,
	minLength,
	nanoid,
	object,
	optional,
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

export const SendReportSchema = object({
	reason: picklist(
		["spam", "inappropriate", "other"],
		"Invalid report reason"
	),
	resourceType: picklist(["post", "user", "comment"], "Invalid report type"),
	reported: pipe(string(), length(25), nanoid("Invalid reported resource ID")),
	description: optional(
		pipe(
			string(),
			minLength(3, "Description must be at least 3 characters long"),
			maxLength(250, "Description must be at most 250 characters long")
		)
	),
});

export type UpdateProfile = InferOutput<typeof UpdateProfileSchema>;
export type SendReport = InferOutput<typeof SendReportSchema>;
