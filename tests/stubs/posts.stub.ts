import { GetPosts } from "@/schemas";

export const selectPostsStub = (): GetPosts => [
	{
		post: {
			id: "1",
			title: "Title",
			description: "Description",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		author: {
			username: "username",
			name: "Name",
			profileImage: "https://example.com",
		},
	},
];
