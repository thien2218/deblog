import { handleDbError } from "@/utils";
import { DrizzleD1Database } from "drizzle-orm/d1";
import {
	commentsTable,
	postsTable,
	reportsTable,
	subscriptionsTable,
	usersTable,
} from "../tables";
import { eq, sql } from "drizzle-orm";
import { SendReport, UpdateProfile } from "@/schemas";

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

export const checkResourceExists = async (
	db: DrizzleD1Database,
	resourceType: SendReport["resourceType"],
	id: string
) => {
	const tables = {
		post: postsTable,
		user: usersTable,
		comment: commentsTable,
	};
	const table = tables[resourceType];

	const query = db.select().from(table).where(eq(table.id, id));

	return await db
		.get<{ exists: boolean }>(sql`select exists${query} as 'exists'`)
		.catch(handleDbError);
};

export const sendReportFromUser = async (
	db: DrizzleD1Database,
	userId: string,
	payload: SendReport
) => {
	const query = db
		.insert(reportsTable)
		.values({
			reporter: sql.placeholder("userId"),
			reported: sql.placeholder("reportedId"),
			resourceType: sql.placeholder("resourceType"),
			reason: sql.placeholder("reason"),
			description: sql.placeholder("description"),
		})
		.prepare();

	return query.execute({ userId, ...payload }).catch(handleDbError);
};

export const subscribeToUser = async (
	db: DrizzleD1Database,
	userId: string,
	username: string
) => {
	const selectQuery = db
		.select({ id: usersTable.id })
		.from(usersTable)
		.where(eq(usersTable.username, sql.placeholder("username")));

	const insertQuery = db
		.insert(subscriptionsTable)
		.values({
			subscriber: sql.placeholder("userId"),
			subscribeTo: sql`${selectQuery}`,
		})
		.prepare();

	return insertQuery.execute({ userId, username }).catch(handleDbError);
};
