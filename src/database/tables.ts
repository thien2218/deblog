import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	username: text("username").notNull().unique(),
	provider: text("provider").default("email"),
	encryptedPassword: text("encrypted_password"),
	emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
});

export const sessionsTable = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => usersTable.id),
	expiresAt: integer("expires_at").notNull(),
});

export const profilesTable = sqliteTable("profiles", {
	userId: text("user_id")
		.primaryKey()
		.notNull()
		.references(() => usersTable.id),
	name: text("name").notNull(),
	profileImage: text("profile_image"),
	title: text("title"),
	bio: text("bio"),
	website: text("website"),
	country: text("country"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const postsTable = sqliteTable("posts", {
	id: text("id").primaryKey(),
	authorId: text("author_id")
		.notNull()
		.references(() => usersTable.id),
	title: text("title").notNull().unique(),
	summary: text("summary").notNull(),
	markdownUrl: text("markdown_url").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});
