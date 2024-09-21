export const db = {
	batch: jest.fn(),
	insert: jest.fn().mockReturnThis(),
	values: jest.fn().mockReturnThis(),
	select: jest.fn().mockReturnThis(),
	from: jest.fn().mockReturnThis(),
	where: jest.fn().mockReturnThis(),
	prepare: jest.fn().mockReturnValue({
		get: jest.fn().mockResolvedValue({
			id: "userId",
			encryptedPassword: "encryptedPassword",
		}),
	}),
};

export const lucia = {
	createSession: jest.fn().mockResolvedValue({ id: "session-id" }),
	createSessionCookie: jest.fn().mockReturnValue({
		serialize: jest.fn().mockReturnValue("cookie"),
	}),
	validateSession: jest.fn().mockResolvedValue({
		session: { id: "session-id", fresh: true },
		user: { id: "user-id" },
	}),
	invalidateSession: jest.fn(),
	createBlankSessionCookie: jest.fn().mockReturnValue({
		serialize: jest.fn().mockReturnValue(""),
	}),
};
