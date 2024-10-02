import { DrizzleD1Database } from "drizzle-orm/d1";
import { postsTable, savedPostsTable, usersTable } from "../tables";
import { and, desc, eq, exists, sql } from "drizzle-orm";
import { handleDbError } from "@/utils";
import { PageQuery, UpdatePost } from "@/schemas";

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
};

export const selectPosts = async (
	db: DrizzleD1Database,
	pageQuery: PageQuery
) => {
	const query = db
		.select({ post: postSchema, author: authorSchema })
		.from(postsTable)
		.where(eq(postsTable.published, true))
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.offset(sql.placeholder("offset"))
		.limit(sql.placeholder("limit"))
		.prepare();

	return query.all(pageQuery).catch(handleDbError);
};

export const selectPostsFromAuthor = async (
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
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.orderBy(desc(postsTable.createdAt))
		.limit(sql.placeholder("limit"))
		.offset(sql.placeholder("offset"))
		.prepare();

	return query.all({ username, ...pageQuery }).catch(handleDbError);
};

export const selectSavedPostsFromUser = async (
	db: DrizzleD1Database,
	userId: string,
	pageQuery: PageQuery
) => {
	const query = db
		.select({ post: postSchema, author: authorSchema })
		.from(savedPostsTable)
		.where(eq(savedPostsTable.userId, sql.placeholder("userId")))
		.innerJoin(postsTable, eq(postsTable.id, savedPostsTable.postId))
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
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

	return query.run({ postId, userId }).catch(handleDbError);
};

export const readPost = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string
) => {
	const query = db
		.select({
			post: postSchema,
			author: {
				...authorSchema,
				role: usersTable.role,
				country: usersTable.country,
			},
		})
		.from(postsTable)
		.where(
			and(
				eq(postsTable.id, sql.placeholder("id")),
				eq(postsTable.authorId, sql.placeholder("authorId")),
				eq(postsTable.published, true)
			)
		)
		.innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
		.prepare();

	return query.get({ id, authorId }).catch(handleDbError);
};

export const updatePostMetadata = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string,
	payload: UpdatePost
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

export const selectExistsPost = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string
) => {
	const query = db.select().from(
		exists(
			db
				.select()
				.from(postsTable)
				.where(
					and(
						eq(postsTable.id, sql.placeholder("id")),
						eq(postsTable.authorId, sql.placeholder("authorId"))
					)
				)
		)
	);

	return !(await query.get({ id, authorId }).catch(handleDbError));
};
