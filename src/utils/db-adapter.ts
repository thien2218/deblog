import { Adapter, UserId, DatabaseSession, DatabaseUser } from "lucia";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { profilesTable, sessionsTable, usersTable } from "@/database/tables";
import { eq, lte, sql } from "drizzle-orm";
import { handleDbError } from "./";

class DBAdapter implements Adapter {
	constructor(private db: DrizzleD1Database) {}

	async deleteSession(sessionId: string) {
		const query = this.db
			.delete(sessionsTable)
			.where(eq(sessionsTable.id, sql.placeholder("sessionId")))
			.prepare();

		await query.run({ sessionId }).catch(handleDbError);
	}

	async deleteUserSessions(userId: UserId) {
		const query = this.db
			.delete(sessionsTable)
			.where(eq(sessionsTable.userId, sql.placeholder("userId")))
			.prepare();

		await query.run({ userId }).catch(handleDbError);
	}

	async deleteExpiredSessions() {
		await this.db
			.delete(sessionsTable)
			.where(lte(sessionsTable.expiresAt, sql`(unixepoch())`));
	}

	async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		const query = this.db
			.select({
				session: sessionsTable,
				user: {
					id: usersTable.id,
					email: usersTable.email,
					username: usersTable.username,
					hasOnboarded: usersTable.hasOnboarded,
					name: profilesTable.name,
					profileImage: profilesTable.profileImage,
				},
			})
			.from(sessionsTable)
			.innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
			.leftJoin(profilesTable, eq(sessionsTable.id, profilesTable.userId))
			.where(eq(sessionsTable.id, sql.placeholder("sessionId")))
			.prepare();

		const result = await query.get({ sessionId }).catch(handleDbError);

		if (!result) return [null, null];

		const {
			session,
			user: { id, ...attributes },
		} = result;

		return [
			{ ...session, attributes: {} },
			{ id, attributes },
		];
	}

	async getUserSessions(userId: UserId): Promise<DatabaseSession[]> {
		const query = this.db
			.select()
			.from(sessionsTable)
			.where(eq(sessionsTable.userId, sql.placeholder("userId")))
			.prepare();

		const sessions = await query.all({ userId }).catch(handleDbError);

		return sessions.map((session) => ({
			...session,
			attributes: {},
		}));
	}

	async setSession(session: DatabaseSession) {
		const query = this.db
			.insert(sessionsTable)
			.values({
				id: sql.placeholder("id"),
				userId: sql.placeholder("userId"),
				expiresAt: sql.placeholder("expiresAt"),
			})
			.prepare();

		await query.run({ ...session }).catch(handleDbError);
	}

	async updateSessionExpiration(sessionId: string, expiresAt: Date) {
		await this.db
			.update(sessionsTable)
			.set({ expiresAt })
			.where(eq(sessionsTable.id, sessionId))
			.run();
	}
}

export default DBAdapter;
