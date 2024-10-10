import { DrizzleD1Database } from "drizzle-orm/d1";
import { profilesTable, usersTable } from "../tables";
import { eq, or, sql } from "drizzle-orm";
import { handleDbError } from "@/utils";
import { CreateProfile } from "@/schemas";

type Signup = {
	id: string;
	email: string;
	username: string;
	encryptedPassword: string;
};

export const insertUser = async (db: DrizzleD1Database, payload: Signup) => {
	const query = db
		.insert(usersTable)
		.values({
			id: sql.placeholder("id"),
			email: sql.placeholder("email"),
			username: sql.placeholder("username"),
			encryptedPassword: sql.placeholder("encryptedPassword"),
		})
		.prepare();

	return query.execute(payload).catch(handleDbError);
};

export const findLoginUser = async (
	db: DrizzleD1Database,
	identifier: string
) => {
	const query = db
		.select({
			id: usersTable.id,
			encryptedPassword: usersTable.encryptedPassword,
		})
		.from(usersTable)
		.where(
			or(
				eq(usersTable.email, sql.placeholder("identifier")),
				eq(usersTable.username, sql.placeholder("identifier"))
			)
		)
		.prepare();

	return query.get({ identifier }).catch(handleDbError);
};

export const createProfile = async (
	db: DrizzleD1Database,
	userId: string,
	payload: CreateProfile
) => {
	const query = db
		.insert(profilesTable)
		.values({
			userId: sql.placeholder("userId"),
			name: sql.placeholder("name"),
			pronoun: sql.placeholder("pronoun"),
			profileImage: sql.placeholder("profileImage"),
			work: sql.placeholder("work"),
			bio: sql.placeholder("bio"),
			website: sql.placeholder("website"),
			country: sql.placeholder("country"),
		})
		.prepare();

	return query.execute({ userId, ...payload }).catch(handleDbError);
};
