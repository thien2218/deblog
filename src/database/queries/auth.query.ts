import { DrizzleD1Database } from "drizzle-orm/d1";
import { usersTable } from "../tables";
import { eq, or, sql } from "drizzle-orm";
import { handleDbError } from "@/utils";

type Signup = {
	id: string;
	name: string;
	email: string;
	username: string;
	encryptedPassword: string;
};

export const insertUser = async (db: DrizzleD1Database, payload: Signup) => {
	const query = db
		.insert(usersTable)
		.values({
			id: sql.placeholder("id"),
			name: sql.placeholder("name"),
			email: sql.placeholder("email"),
			username: sql.placeholder("username"),
			encryptedPassword: sql.placeholder("encryptedPassword"),
		})
		.prepare();

	return query.execute(payload).catch(handleDbError);
};

export const selectLoginUser = async (
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
