import { DrizzleD1Database } from "drizzle-orm/d1";
import {
	postsTable,
	profilesTable,
	savedPostsTable,
	usersTable,
} from "../tables";
import { and, desc, eq, sql } from "drizzle-orm";
import { handleDbError } from "@/utils";
import { PageQuery, UpdatePostMetadata } from "@/schemas";
import { authorColumns } from "./";

const postColumns = {
	id: postsTable.id,
	title: postsTable.title,
	description: postsTable.description,
	createdAt: postsTable.createdAt,
	updatedAt: postsTable.updatedAt,
};

export const findPosts = async (db: DrizzleD1Database, page: PageQuery) => {
	const query = db
		.select({ post: postColumns, author: authorColumns })
		.from(postsTable)
		.where(eq(postsTable.published, true))
		.leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
		.offset(sql.placeholder("offset"))
		.limit(sql.placeholder("limit"))
		.prepare();

	return query.all(page).catch(handleDbError);
};

export const findPostsFromAuthor = async (
	db: DrizzleD1Database,
	username: string,
	page: PageQuery
) => {
	const query = db
		.select({ post: postColumns, author: authorColumns })
		.from(postsTable)
		.where(
			and(
				eq(usersTable.username, sql.placeholder("username")),
				eq(postsTable.authorId, usersTable.id),
				eq(postsTable.published, true)
			)
		)
		.leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.orderBy(desc(postsTable.createdAt))
		.limit(sql.placeholder("limit"))
		.offset(sql.placeholder("offset"))
		.prepare();

	return query.all({ username, ...page }).catch(handleDbError);
};

export const findSavedPosts = async (
	db: DrizzleD1Database,
	userId: string,
	page: PageQuery
) => {
	const query = db
		.select(postColumns)
		.from(savedPostsTable)
		.where(eq(savedPostsTable.userId, sql.placeholder("userId")))
		.innerJoin(postsTable, eq(postsTable.id, savedPostsTable.postId))
		.orderBy(desc(savedPostsTable.savedAt))
		.limit(sql.placeholder("limit"))
		.offset(sql.placeholder("offset"))
		.prepare();

	return query.all({ userId, ...page }).catch(handleDbError);
};

export const insertDraft = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string
) => {
	const query = db
		.insert(postsTable)
		.values({
			id: sql.placeholder("id"),
			authorId: sql.placeholder("authorId"),
			title: "Untitled",
		})
		.prepare();

	return query.execute({ id, authorId }).catch(handleDbError);
};

export const savePost = async (
	db: DrizzleD1Database,
	postId: string,
	userId: string
) => {
	const query = db
		.insert(savedPostsTable)
		.values({
			postId: sql.placeholder("postId"),
			userId: sql.placeholder("userId"),
		})
		.prepare();

	return query.execute({ postId, userId }).catch(handleDbError);
};

export const readPostFromAuthor = async (
	db: DrizzleD1Database,
	id: string,
	username: string
) => {
	const query = db
		.select({
			post: postColumns,
			author: {
				id: usersTable.id,
				...authorColumns,
				pronoun: profilesTable.pronoun,
				country: profilesTable.country,
				website: profilesTable.website,
			},
		})
		.from(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(usersTable.username, sql.placeholder("username")),
				eq(postsTable.published, true)
			)
		)
		.leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
		.prepare();

	return query.get({ id, username }).catch(handleDbError);
};

export const updatePostMetadata = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string,
	payload: UpdatePostMetadata
) => {
	const query = db
		.update(postsTable)
		.set(payload)
		.where(and(eq(postsTable.id, id), eq(postsTable.authorId, authorId)));

	return query.run().catch(handleDbError);
};

export const findExistsPost = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string
) => {
	const query = db
		.select()
		.from(postsTable)
		.where(and(eq(postsTable.id, id), eq(postsTable.authorId, authorId)));

	return await db
		.get<{ exists: boolean }>(sql`select exists${query} as 'exists'`)
		.catch(handleDbError);
};

export const deletePost = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string
) => {
	const query = db
		.delete(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId"))
			)
		)
		.returning({ isPublished: postsTable.published })
		.prepare();

	return query.get({ id, authorId }).catch(handleDbError);
};

export const findDrafts = async (
	db: DrizzleD1Database,
	authorId: string,
	page: PageQuery
) => {
	const query = db
		.select(postColumns)
		.from(postsTable)
		.where(
			and(
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.published, false)
			)
		)
		.orderBy(desc(postsTable.createdAt))
		.limit(sql.placeholder("limit"))
		.offset(sql.placeholder("offset"))
		.prepare();

	return query.all({ authorId, ...page }).catch(handleDbError);
};

export const readDraft = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string
) => {
	const query = db
		.select(postColumns)
		.from(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.published, false)
			)
		)
		.prepare();

	return query.get({ id, authorId }).catch(handleDbError);
};

export const publishDraft = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string
) => {
	const query = db
		.update(postsTable)
		.set({ published: true })
		.where(
			and(
				eq(postsTable.id, id),
				eq(postsTable.authorId, authorId),
				eq(postsTable.published, false)
			)
		);

	return query.run().catch(handleDbError);
};
