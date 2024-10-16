import { DrizzleD1Database } from "drizzle-orm/d1";
import { postTagsTable, tagsTable } from "../tables";
import { and, eq, inArray, sql } from "drizzle-orm";
import { handleDbError } from "@/utils";

export const addTagsToPost = async (
	db: DrizzleD1Database,
	postId: string,
	tags: string[]
) => {
	const insertTagsQuery = db
		.insert(tagsTable)
		.values(tags.map((tag) => ({ name: sql`lower(${tag})` })))
		.onConflictDoNothing();

	const insertPostTagsQuery = db.insert(postTagsTable).values(
		tags.map((tag) => ({
			postId,
			tagName: sql`lower(${tag})`,
			originalTag: tag,
		}))
	);

	return db.batch([insertTagsQuery, insertPostTagsQuery]).catch(handleDbError);
};

export const removeTagsFromPost = async (
	db: DrizzleD1Database,
	postId: string,
	tags: string[]
) => {
	const query = db
		.delete(postTagsTable)
		.where(
			and(
				eq(postTagsTable.postId, sql.placeholder("postId")),
				inArray(
					postTagsTable.originalTag,
					sql`(${sql.placeholder("tags")})`
				)
			)
		)
		.returning({ tag: postTagsTable.originalTag })
		.prepare();

	return query.all({ postId, tags }).catch(handleDbError);
};
