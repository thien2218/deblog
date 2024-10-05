import { DrizzleD1Database } from "drizzle-orm/d1";
import { seriesTable, usersTable } from "../tables";
import { eq, sql } from "drizzle-orm";
import { handleDbError } from "@/utils";

export const findSeries = async (db: DrizzleD1Database, username: string) => {
	const findUserIdSubQuery = db
		.select({ id: usersTable.id })
		.from(usersTable)
		.where(eq(usersTable.username, sql.placeholder("username")));

	const query = db
		.select({
			id: seriesTable.id,
			title: seriesTable.title,
			description: seriesTable.description,
			createdAt: seriesTable.createdAt,
			lastPostAddedAt: seriesTable.lastPostAddedAt,
		})
		.from(seriesTable)
		.where(eq(seriesTable.authorId, findUserIdSubQuery));

	return query.all({ username }).catch(handleDbError);
};
