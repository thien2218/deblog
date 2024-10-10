import { DrizzleD1Database } from "drizzle-orm/d1";
import {
	postSeriesTable,
	postsTable,
	profilesTable,
	seriesTable,
	usersTable,
} from "../tables";
import { and, eq, inArray, max, SQL, sql } from "drizzle-orm";
import { handleDbError } from "@/utils";
import { CreateSeries, UpdateSeries, UpdateSeriesPosts } from "@/schemas";
import { nanoid } from "nanoid";
import { authorColumns } from "./";

const seriesColumns = {
	id: seriesTable.id,
	title: seriesTable.title,
	description: seriesTable.description,
	createdAt: seriesTable.createdAt,
	lastPostAddedAt: seriesTable.lastPostAddedAt,
};

type SeriesPostsOrder = {
	postId: string;
	order: number;
};

export const findSeries = async (db: DrizzleD1Database) => {
	const query = db
		.select({ series: seriesColumns, author: authorColumns })
		.from(seriesTable)
		.leftJoin(usersTable, eq(seriesTable.authorId, usersTable.id))
		.leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
		.prepare();

	return query.all().catch(handleDbError);
};

export const findSeriesByAuthor = async (
	db: DrizzleD1Database,
	username: string
) => {
	const findUserIdSubQuery = db
		.select({ id: usersTable.id })
		.from(usersTable)
		.where(eq(usersTable.username, sql.placeholder("username")));

	const query = db
		.select(seriesColumns)
		.from(seriesTable)
		.where(eq(seriesTable.authorId, findUserIdSubQuery))
		.prepare();

	return query.all({ username }).catch(handleDbError);
};

export const getSeriesById = async (
	db: DrizzleD1Database,
	seriesId: string
) => {
	const query = db
		.select({ series: seriesColumns, author: authorColumns })
		.from(seriesTable)
		.leftJoin(usersTable, eq(seriesTable.authorId, usersTable.id))
		.leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
		.where(eq(seriesTable.id, sql.placeholder("seriesId")))
		.prepare();

	return query.get({ seriesId }).catch(handleDbError);
};

export const getPostsInSeries = async (
	db: DrizzleD1Database,
	seriesId: string
) => {
	const query = db
		.select({
			id: postsTable.id,
			title: postsTable.title,
			description: postsTable.description,
			order: postSeriesTable.order,
		})
		.from(postsTable)
		.innerJoin(postSeriesTable, eq(postsTable.id, postSeriesTable.postId))
		.orderBy(postSeriesTable.order)
		.where(eq(postSeriesTable.seriesId, sql.placeholder("seriesId")))
		.prepare();

	return query.all({ seriesId }).catch(handleDbError);
};

export const createSeries = async (
	db: DrizzleD1Database,
	authorId: string,
	payload: CreateSeries
) => {
	const id = nanoid(25);

	const query = db
		.insert(seriesTable)
		.values({
			id: sql.placeholder("id"),
			title: sql.placeholder("title"),
			description: sql.placeholder("description"),
			authorId: sql.placeholder("authorId"),
		})
		.prepare();

	await query.execute({ id, authorId, ...payload }).catch(handleDbError);

	return id;
};

export const updateSeries = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string,
	payload: UpdateSeries
) => {
	const query = db
		.update(seriesTable)
		.set(payload)
		.where(and(eq(seriesTable.id, id), eq(seriesTable.authorId, authorId)));

	return query.run().catch(handleDbError);
};

export const deleteSeries = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string
) => {
	const query = db
		.delete(seriesTable)
		.where(
			and(
				eq(seriesTable.id, sql.placeholder("id")),
				eq(seriesTable.authorId, sql.placeholder("authorId"))
			)
		)
		.prepare();

	return query.run({ id, authorId }).catch(handleDbError);
};

export const getSeriesMaxOrder = async (db: DrizzleD1Database, id: string) => {
	const query = db
		.select({ value: max(postSeriesTable.order) })
		.from(postSeriesTable)
		.where(eq(postSeriesTable.seriesId, sql.placeholder("id")))
		.prepare();

	const data = await query.get({ id }).catch(handleDbError);

	return data?.value || 0;
};

export const isSeriesByAuthor = async (
	db: DrizzleD1Database,
	id: string,
	authorId: string
) => {
	const query = db
		.select()
		.from(seriesTable)
		.where(and(eq(seriesTable.id, id), eq(seriesTable.authorId, authorId)));

	return db
		.get<{ valid: boolean }>(sql`select exists${query} as valid`)
		.catch(handleDbError);
};

export const arePostsByAuthor = async (
	db: DrizzleD1Database,
	authorId: string,
	postIds: string[]
) => {
	const query = db
		.select({ postId: postsTable.id })
		.from(postsTable)
		.where(
			and(
				eq(seriesTable.authorId, sql.placeholder("authorId")),
				inArray(postsTable.id, sql.placeholder("postIds"))
			)
		)
		.prepare();

	return query.all({ authorId, postIds }).catch(handleDbError);
};

export const addPostsToSeries = async (
	db: DrizzleD1Database,
	postsToAdd: (SeriesPostsOrder & { seriesId: string })[]
) => {
	const query = db.insert(postSeriesTable).values(postsToAdd).prepare();
	return query.execute().catch(handleDbError);
};

export const removeSeriesPosts = async (
	db: DrizzleD1Database,
	seriesId: string,
	postIds: string[]
) => {
	const query = db
		.delete(postSeriesTable)
		.where(
			and(
				eq(postSeriesTable.seriesId, sql.placeholder("seriesId")),
				inArray(postSeriesTable.postId, sql.placeholder("postIds"))
			)
		)
		.returning({ postId: postSeriesTable.postId })
		.prepare();

	return query.all({ seriesId, postIds }).catch(handleDbError);
};

export const reorderSeriesPosts = async (
	db: DrizzleD1Database,
	seriesId: string,
	posts: UpdateSeriesPosts
) => {
	const chunks: SQL[] = [sql`case`];

	for (const { id, newOrder } of posts) {
		chunks.push(sql`when ${postSeriesTable.postId} = ${id} then ${newOrder}`);
	}

	const query = db
		.update(postSeriesTable)
		.set({ order: sql.join(chunks, sql` `) })
		.where(
			and(
				eq(postSeriesTable.seriesId, seriesId),
				inArray(
					postSeriesTable.postId,
					posts.map(({ id }) => id)
				)
			)
		)
		.returning({ postId: postSeriesTable.postId });

	return query.all().catch(handleDbError);
};
