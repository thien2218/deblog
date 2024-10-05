import { sql } from "drizzle-orm";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
	unique,
} from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	username: text("username").notNull().unique(),
	provider: text("provider").default("email").notNull(),
	encryptedPassword: text("encrypted_password"),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.default(false)
		.notNull(),
	name: text("name").notNull(),
	pronoun: text("pronoun").notNull().default("they/them"),
	profileImage: text("profile_image"),
	role: text("role"),
	bio: text("bio"),
	website: text("website"),
	country: text("country"),
	joinedSince: integer("joined_since", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const sessionsTable = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	expiresAt: integer("expires_at").notNull(),
});

export const postsTable = sqliteTable(
	"posts",
	{
		id: text("id").primaryKey(),
		seriesId: text("series_id").references(() => seriesTable.id, {
			onDelete: "set null",
		}),
		seriesOrder: integer("series_order"),
		authorId: text("author_id").references(() => usersTable.id, {
			onDelete: "set null",
		}),
		title: text("title").notNull().unique(),
		description: text("description"),
		published: integer("published", { mode: "boolean" })
			.notNull()
			.default(false),
		// coverImage: text("cover_image"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(table) => ({
		seriesUniqueOrder: unique("series_order_unique").on(
			table.seriesId,
			table.seriesOrder
		),
	})
);

export const seriesTable = sqliteTable("series", {
	id: text("id").primaryKey(),
	authorId: text("author_id").references(() => usersTable.id, {
		onDelete: "set null",
	}),
	title: text("title").notNull().unique(),
	description: text("description"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	lastPostAddedAt: integer("last_post_added_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const savedPostsTable = sqliteTable(
	"saved_posts",
	{
		userId: text("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		postId: text("post_id")
			.notNull()
			.references(() => postsTable.id, { onDelete: "cascade" }),
		savedAt: integer("saved_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.userId, table.postId] }),
	})
);

export const commentsTable = sqliteTable("comments", {
	id: text("id").primaryKey(),
	authorId: text("author_id").references(() => usersTable.id, {
		onDelete: "set null",
	}),
	postId: text("post_id").references(() => postsTable.id, {
		onDelete: "set null",
	}),
	content: text("content").notNull(),
	edited: integer("edited", { mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const reportsTable = sqliteTable(
	"reports",
	{
		reporter: text("reporter")
			.notNull()
			.references(() => usersTable.id, { onDelete: "set null" }),
		reported: text("reported").notNull(),
		resourceType: text("resource_type").notNull(),
		reason: text("reason").notNull(),
		description: text("description"),
		reportedAt: integer("reported_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.reporter, table.reported] }),
	})
);

export const subscriptionsTable = sqliteTable(
	"subscriptions",
	{
		subscriber: text("subscriber")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		subscribeTo: text("subscribe_to")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		subscribedSince: integer("subscribed_since", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.subscriber, table.subscribeTo] }),
	})
);

export const tagsTable = sqliteTable("tags", {
	name: text("name").primaryKey(),
});

export const postTagsTable = sqliteTable(
	"post_tags",
	{
		postId: text("post_id")
			.notNull()
			.references(() => postsTable.id, { onDelete: "cascade" }),
		tagName: text("tag_name")
			.notNull()
			.references(() => tagsTable.name, { onDelete: "cascade" }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.postId, table.tagName] }),
	})
);
