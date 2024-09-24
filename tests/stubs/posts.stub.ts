import { SelectPost } from "@/schemas/post.schema";

export const selectPostStub = (): SelectPost => ({
	post: {
		id: "1",
		title: "Title",
		summary: "Summary",
		markdownUrl: "https://example.com",
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	author: {
		username: "username",
		name: "Name",
		profileImage: "https://example.com",
		title: "Title",
		country: "Country",
	},
});
