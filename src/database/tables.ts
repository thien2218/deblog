import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	username: text("username").notNull().unique(),
	provider: text("provider").default("email"),
	encryptedPassword: text("encrypted_password"),
	emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
	name: text("name").notNull(),
	profileImage: text("profile_image"),
	role: text("role"),
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

export const sessionsTable = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => usersTable.id),
	expiresAt: integer("expires_at").notNull(),
});

export const postsTable = sqliteTable("posts", {
	id: text("id").primaryKey(),
	authorId: text("author_id")
		.notNull()
		.references(() => usersTable.id),
	title: text("title").notNull().unique(),
	description: text("description"),
	markdownUrl: text("markdown_url").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});
