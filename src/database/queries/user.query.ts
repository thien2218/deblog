import { handleDbError } from "@/utils";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { usersTable } from "../tables";
import { eq, sql } from "drizzle-orm";
import { UpdateProfile } from "@/schemas/user.schema";

export const findProfile = async (db: DrizzleD1Database, username: string) => {
	const query = db
		.select({
			username: usersTable.username,
			name: usersTable.name,
			profileImage: usersTable.profileImage,
			role: usersTable.role,
			bio: usersTable.bio,
			website: usersTable.website,
			country: usersTable.country,
			joinedSince: usersTable.joinedSince,
		})
		.from(usersTable)
		.where(eq(usersTable.username, sql.placeholder("username")))
		.prepare();

	return query.get({ username }).catch(handleDbError);
};

export const updateProfile = async (
	db: DrizzleD1Database,
	userId: string,
	payload: UpdateProfile
) => {
	const query = db
		.update(usersTable)
		.set(payload)
		.where(eq(usersTable.id, sql.placeholder("userId")))
		.prepare();

	return query.run({ userId }).catch(handleDbError);
};
