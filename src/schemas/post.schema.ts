import { date, object, string } from "valibot";
import { SelectUserSchema } from "./user.schema";

export const SelectPostSchema = object({
	post: object({
		id: string(),
		title: string(),
		summary: string(),
		markdownUrl: string(),
		createdAt: date(),
		updatedAt: date(),
	}),
	author: SelectUserSchema,
});
