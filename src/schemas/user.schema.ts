import { countryCodes } from "@/utils";
import {
	check,
	forward,
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

export const CreateProfileSchema = object({
	name: pipe(
		string(),
		minLength(3, "Name must be at least 3 characters long"),
		maxLength(50, "Name must be at most 50 characters long")
	),
	work: pipe(
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
	pronoun: picklist(
		["he/him", "she/her", "they/them"],
		"Pronoun can only be he/him, she/her, or they/them"
	),
});

export const UpdateProfileSchema = pipe(
	partial(CreateProfileSchema),
	check((v) => Object.keys(v).length > 0, "No fields to update")
);

const reasons = {
	post: [
		"spam",
		"inappropriate",
		"misinformation",
		"plagiarism",
		"violence",
		"hate speech",
		"illegal content",
		"other",
	],
	user: [
		"spam",
		"pornography",
		"harassment",
		"impersonation",
		"scam",
		"fake account",
		"other",
	],
	comment: [
		"spam",
		"personal attack",
		"hate speech",
		"harassment",
		"threats",
		"abusive language",
		"other",
	],
};

export const SendReportSchema = pipe(
	object({
		reason: string(),
		resourceType: picklist(
			["post", "user", "comment"],
			"Invalid report type"
		),
		reported: pipe(
			string(),
			length(25, "Invalid reported resource ID"),
			nanoid("Invalid reported resource ID")
		),
		description: optional(
			pipe(
				string(),
				minLength(3, "Description must be at least 3 characters long"),
				maxLength(250, "Description must be at most 250 characters long")
			)
		),
	}),
	forward(
		check(
			({ reason, resourceType }) => reasons[resourceType].includes(reason),
			"Invalid report reason"
		),
		["reason"]
	)
);

export type CreateProfile = InferOutput<typeof CreateProfileSchema>;
export type UpdateProfile = InferOutput<typeof UpdateProfileSchema>;
export type SendReport = InferOutput<typeof SendReportSchema>;
