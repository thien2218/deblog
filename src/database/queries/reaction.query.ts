import { PostReaction } from "@/schemas";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { commentsTable, postsTable, reactionsTable } from "../tables";
import { and, eq, sql } from "drizzle-orm";
import { handleDbError } from "@/utils";

const tables = {
	post: postsTable,
	comment: commentsTable,
};

export const isValidTarget = async (
	db: DrizzleD1Database,
	targetId: string,
	targetType: "post" | "comment"
) => {
	const table = tables[targetType];
	const query = db.select().from(table).where(eq(table.id, targetId));
	return db.get<{ valid: boolean }>(sql`select exists${query} as 'valid'`);
};

export const addReaction = async (
	db: DrizzleD1Database,
	targetId: string,
	targetType: "post" | "comment",
	userId: string,
	reaction: PostReaction
) => {
	const query = db
		.insert(reactionsTable)
		.values({
			targetId: sql.placeholder("targetId"),
			targetType: sql.placeholder("targetType"),
			userId: sql.placeholder("userId"),
			reaction: sql.placeholder("reaction"),
		})
		.prepare();

	return query
		.execute({ targetId, targetType, userId, reaction })
		.catch(handleDbError);
};

export const removeReaction = async (
	db: DrizzleD1Database,
	targetId: string,
	targetType: "post" | "comment",
	userId: string
) => {
	const query = db
		.delete(reactionsTable)
		.where(
			and(
				eq(reactionsTable.targetId, sql.placeholder("targetId")),
				eq(reactionsTable.targetType, sql.placeholder("targetType")),
				eq(reactionsTable.userId, sql.placeholder("userId"))
			)
		)
		.prepare();

	return query.run({ targetId, targetType, userId }).catch(handleDbError);
};
