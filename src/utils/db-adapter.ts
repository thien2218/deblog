import { Adapter, UserId, DatabaseSession, DatabaseUser } from "lucia";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { profilesTable, sessionsTable, usersTable } from "@/database/tables";
import { eq, lte, sql } from "drizzle-orm";
import { handleDbError, SessionCache } from "./";

class DBAdapter implements Adapter {
	constructor(private db: DrizzleD1Database, private kvProfile: KVNamespace) {}

	async deleteSession(sessionId: string) {
		await this.kvProfile.delete(sessionId);

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
			.returning({ id: sessionsTable.id })
			.prepare();

		const sessionIds = await query.all({ userId }).catch(handleDbError);

		await Promise.all(sessionIds.map(({ id }) => this.kvProfile.delete(id)));
	}

	async deleteExpiredSessions() {
		await this.db
			.delete(sessionsTable)
			.where(lte(sessionsTable.expiresAt, sql`(unixepoch())`));
	}

	async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		const cached = await this.kvProfile.get(sessionId);
		let result: SessionCache | undefined;

		if (!cached) {
			const query = this.db
				.select({
					session: { expiresAt: sessionsTable.expiresAt },
					user: {
						id: usersTable.id,
						email: usersTable.email,
						username: usersTable.username,
						hasOnboarded: usersTable.hasOnboarded,
						emailVerified: usersTable.emailVerified,
						name: profilesTable.name,
						profileImage: profilesTable.profileImage,
					},
				})
				.from(sessionsTable)
				.innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
				.leftJoin(profilesTable, eq(sessionsTable.id, profilesTable.userId))
				.where(eq(sessionsTable.id, sql.placeholder("sessionId")))
				.prepare();

			result = await query.get({ sessionId }).catch(handleDbError);

			if (!result) return [null, null];

			await this.kvProfile.put(sessionId, JSON.stringify(result));
		} else {
			result = JSON.parse(cached) as SessionCache;
		}

		const {
			session: { expiresAt },
			user: { id, ...attributes },
		} = result;

		return [
			{ id: sessionId, userId: id, expiresAt, attributes: {} },
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
		const cached = await this.kvProfile.get(sessionId);

		if (cached) {
			const { user } = JSON.parse(cached) as SessionCache;

			await this.kvProfile.put(
				sessionId,
				JSON.stringify({ session: { expiresAt }, user })
			);
		}

		await this.db
			.update(sessionsTable)
			.set({ expiresAt })
			.where(eq(sessionsTable.id, sessionId))
			.run();
	}
}

export default DBAdapter;
