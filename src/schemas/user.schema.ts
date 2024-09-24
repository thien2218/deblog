import { date, object, string } from "valibot";

export const SelectUserSchema = object({
	id: string(),
	username: string(),
	name: string(),
	profileImage: string(),
	title: string(),
	bio: string(),
	website: string(),
	country: string(),
	createdAt: date(),
	updatedAt: date(),
});
