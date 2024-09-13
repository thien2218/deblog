import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	username: text("username").notNull().unique(),
	provider: text("provider").default("email"),
	encryptedPassword: text("encrypted_password"),
	emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
});

export const sessionTable = sqliteTable("session", {
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
		.references(() => usersTable.id)
		.unique(),
	name: text("name").notNull(),
	profileImage: text("profile_image"),
	bio: text("bio"),
	website: text("website"),
	location: text("location"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
});

// export const postsTable = sqliteTable("posts", {});
