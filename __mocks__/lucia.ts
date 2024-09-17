export const Lucia = jest.fn(() => ({
	createSession: jest.fn(() => ({
		id: "session-id",
	})),
	createSessionCookie: jest.fn(() => ({
		serialize: jest.fn(() => "cookie"),
	})),
}));
