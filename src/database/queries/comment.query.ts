import { PageQuery } from "@/schemas";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { commentsTable, usersTable } from "../tables";
import { and, eq, sql } from "drizzle-orm";
import { handleDbError } from "@/utils";
import { nanoid } from "nanoid";

export const getCommentsOfPost = async (
	db: DrizzleD1Database,
	postId: string,
	page: PageQuery
) => {
	const query = db
		.select({
			id: commentsTable.id,
			content: commentsTable.content,
			edited: commentsTable.edited,
			createdAt: commentsTable.createdAt,
		})
		.from(commentsTable)
		.innerJoin(usersTable, eq(commentsTable.authorId, usersTable.id))
		.where(eq(commentsTable.postId, sql.placeholder("postId")))
		.limit(sql.placeholder("limit"))
		.offset(sql.placeholder("offset"));

	return query.all({ postId, ...page }).catch(handleDbError);
};

export const addComment = async (
	db: DrizzleD1Database,
	postId: string,
	authorId: string,
	content: string
) => {
	const query = db
		.insert(commentsTable)
		.values({
			id: sql.placeholder("id"),
			postId: sql.placeholder("postId"),
			authorId: sql.placeholder("authorId"),
			content: sql.placeholder("content"),
		})
		.prepare();

	return query
		.run({ id: nanoid(25), postId, authorId, content })
		.catch(handleDbError);
};

export const editComment = async (
	db: DrizzleD1Database,
	postId: string,
	commentId: string,
	authorId: string,
	content: string
) => {
	const query = db
		.update(commentsTable)
		.set({ edited: true, content })
		.where(
			and(
				eq(commentsTable.id, commentId),
				eq(commentsTable.postId, postId),
				eq(commentsTable.authorId, authorId)
			)
		);

	return query.run().catch(handleDbError);
};

export const deleteComment = async (
	db: DrizzleD1Database,
	postId: string,
	commentId: string,
	authorId: string
) => {
	const query = db
		.delete(commentsTable)
		.where(
			and(
				eq(commentsTable.id, sql.placeholder("commentId")),
				eq(commentsTable.postId, sql.placeholder("postId")),
				eq(commentsTable.authorId, sql.placeholder("authorId"))
			)
		)
		.prepare();

	return query.run({ commentId, postId, authorId }).catch(handleDbError);
};

export const getRepliesOfComment = async (
	db: DrizzleD1Database,
	postId: string,
	parentId: string,
	page: PageQuery
) => {
	const query = db
		.select({
			id: commentsTable.id,
			content: commentsTable.content,
			edited: commentsTable.edited,
			createdAt: commentsTable.createdAt,
			mentions: commentsTable.mentions,
		})
		.from(commentsTable)
		.where(
			and(
				eq(commentsTable.parentId, sql.placeholder("parentId")),
				eq(commentsTable.postId, sql.placeholder("postId"))
			)
		)
		.limit(sql.placeholder("limit"))
		.offset(sql.placeholder("offset"))
		.prepare();

	return query.all({ postId, parentId, ...page }).catch(handleDbError);
};

export const getThreadValidMentions = async (
	db: DrizzleD1Database,
	postId: string,
	parentId: string
) => {
	const query = db
		.selectDistinct({ mention: usersTable.username })
		.from(usersTable)
		.innerJoin(commentsTable, eq(usersTable.id, commentsTable.authorId))
		.where(
			and(
				eq(commentsTable.postId, sql.placeholder("postId")),
				eq(commentsTable.parentId, sql.placeholder("parentId"))
			)
		)
		.prepare();

	return query.all({ postId, parentId }).catch(handleDbError);
};

export const addReply = async (
	db: DrizzleD1Database,
	postId: string,
	parentId: string,
	authorId: string,
	payload: { content: string; mentions: string[] }
) => {
	const query = db
		.insert(commentsTable)
		.values({
			id: sql.placeholder("id"),
			postId: sql.placeholder("postId"),
			parentId: sql.placeholder("parentId"),
			authorId: sql.placeholder("authorId"),
			content: sql.placeholder("content"),
			mentions: sql.placeholder("mentions"),
		})
		.returning({ id: commentsTable.id })
		.prepare();

	return query
		.get({ id: nanoid(25), postId, parentId, authorId, ...payload })
		.catch(handleDbError);
};
