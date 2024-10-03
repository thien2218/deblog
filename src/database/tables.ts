import { sql } from "drizzle-orm";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
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
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
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
		reporter: text("reporter_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		reported: text("reported_id").notNull(),
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
