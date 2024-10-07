import { DrizzleD1Database } from "drizzle-orm/d1";
import { postsTable, savedPostsTable, usersTable } from "../tables";
import { and, desc, eq, sql } from "drizzle-orm";
import { handleDbError } from "@/utils";
import { PageQuery, UpdatePostMetadata } from "@/schemas";

const postSchema = {
	id: postsTable.id,
	title: postsTable.title,
	description: postsTable.description,
	createdAt: postsTable.createdAt,
	updatedAt: postsTable.updatedAt,
};

const authorSchema = {
	username: usersTable.username,
	name: usersTable.name,
	profileImage: usersTable.profileImage,
	role: usersTable.role,
};

export const findPosts = async (
	db: DrizzleD1Database,
	pageQuery: PageQuery
) => {
	const query = db
		.select({ post: postSchema, author: authorSchema })
		.from(postsTable)
		.where(eq(postsTable.published, true))
		.leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.offset(sql.placeholder("offset"))
		.limit(sql.placeholder("limit"))
		.prepare();

	return query.all(pageQuery).catch(handleDbError);
};

export const findPostsFromAuthor = async (
	db: DrizzleD1Database,
	username: string,
	pageQuery: PageQuery
) => {
	const query = db
		.select({ post: postSchema, author: authorSchema })
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

	return query.all({ username, ...pageQuery }).catch(handleDbError);
};

export const findSavedPosts = async (
	db: DrizzleD1Database,
	userId: string,
	pageQuery: PageQuery
) => {
	const query = db
		.select(postSchema)
		.from(savedPostsTable)
		.where(eq(savedPostsTable.userId, sql.placeholder("userId")))
		.innerJoin(postsTable, eq(postsTable.id, savedPostsTable.postId))
		.orderBy(desc(savedPostsTable.savedAt))
		.limit(sql.placeholder("limit"))
		.offset(sql.placeholder("offset"))
		.prepare();

	return query.all({ userId, ...pageQuery }).catch(handleDbError);
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
			post: postSchema,
			author: {
				id: usersTable.id,
				...authorSchema,
				pronoun: usersTable.pronoun,
				country: usersTable.country,
				website: usersTable.website,
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
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId"))
			)
		)
		.prepare();

	return query.run({ id, authorId }).catch(handleDbError);
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
	pageQuery: PageQuery
) => {
	const query = db
		.select(postSchema)
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

	return query.all({ authorId, ...pageQuery }).catch(handleDbError);
};

export const readDraft = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string
) => {
	const query = db
		.select(postSchema)
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
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.published, false)
			)
		)
		.prepare();

	return query.run({ id, authorId }).catch(handleDbError);
};
