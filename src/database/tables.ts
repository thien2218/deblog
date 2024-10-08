import { sql } from "drizzle-orm";
import {
	AnySQLiteColumn,
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
	providers: text("providers", { mode: "json" })
		.$type<("email" | "google" | "github")[]>()
		.default(["email"])
		.notNull(),
	encryptedPassword: text("encrypted_password"),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.default(false)
		.notNull(),
	hasOnboarded: integer("has_onboarded", { mode: "boolean" })
		.default(false)
		.notNull(),
});

export const profilesTable = sqliteTable("profiles", {
	userId: text("user_id")
		.primaryKey()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	pronoun: text("pronoun").notNull(),
	profileImage: text("profile_image"),
	work: text("work"),
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
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const postsTable = sqliteTable("posts", {
	id: text("id").primaryKey(),
	authorId: text("author_id").references(() => usersTable.id, {
		onDelete: "set null",
	}),
	title: text("title").notNull().unique(),
	description: text("description"),
	published: integer("published", { mode: "boolean" })
		.notNull()
		.default(false),
	coverImage: text("cover_image"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

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

export const postSeriesTable = sqliteTable(
	"post_series",
	{
		postId: text("post_id")
			.notNull()
			.references(() => postsTable.id, { onDelete: "cascade" }),
		seriesId: text("series_id")
			.notNull()
			.references(() => seriesTable.id, { onDelete: "cascade" }),
		order: integer("order").notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.postId, table.seriesId] }),
		seriesOrderUnique: unique("series_order_unique").on(
			table.seriesId,
			table.order
		),
	})
);

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
	parentId: text("parent_id").references(
		(): AnySQLiteColumn => commentsTable.id,
		{ onDelete: "cascade" }
	),
	mentions: text("mentions", { mode: "json" }).$type<string[]>(),
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
		originalTag: text("original_tag").notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.postId, table.tagName] }),
	})
);

export const reactionsTable = sqliteTable(
	"reactions",
	{
		userId: text("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		targetId: text("target_id").notNull(),
		targetType: text("target_type").notNull(),
		reaction: text("reaction").notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.targetId, table.userId] }),
	})
);
