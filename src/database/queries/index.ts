import { profilesTable, usersTable } from "../tables";

export * from "./auth.query";
export * from "./post.query";
export * from "./user.query";
export * from "./comment.query";
export * from "./series.query";
export * from "./tag.query";
export * from "./reaction.query";

export const authorColumns = {
	username: usersTable.username,
	name: profilesTable.name,
	profileImage: profilesTable.profileImage,
	work: profilesTable.work,
	joinedSince: profilesTable.joinedSince,
};
