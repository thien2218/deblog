export const db = {
	select: jest.fn().mockReturnThis(),
	update: jest.fn().mockReturnThis(),
	delete: jest.fn().mockReturnThis(),
	insert: jest.fn().mockReturnThis(),

	from: jest.fn().mockReturnThis(),
	values: jest.fn().mockReturnThis(),
	set: jest.fn().mockReturnThis(),

	where: jest.fn().mockReturnThis(),
	returning: jest.fn().mockReturnThis(),
	prepare: jest.fn().mockReturnThis(),

	innerJoin: jest.fn().mockReturnThis(),
	leftJoin: jest.fn().mockReturnThis(),
	rightJoin: jest.fn().mockReturnThis(),
	fullJoin: jest.fn().mockReturnThis(),

	limit: jest.fn().mockReturnThis(),
	orderBy: jest.fn().mockReturnThis(),
	groupBy: jest.fn().mockReturnThis(),
	offset: jest.fn().mockReturnThis(),

	transaction: jest.fn(),
	batch: jest.fn(),

	get: jest.fn().mockResolvedValue({}),
	execute: jest.fn().mockResolvedValue({}),
	run: jest.fn().mockResolvedValue({}),
	all: jest.fn().mockResolvedValue({}),
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
	sessionCookieName: "cookie-name",
};
