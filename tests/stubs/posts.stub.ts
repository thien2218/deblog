import { CreatePost, SelectPost } from "@/schemas";

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

export const createPostStub = (): CreatePost => ({
	title: "Title",
	summary: "Summary for the post",
	markdownUrl: "https://example.com",
});
