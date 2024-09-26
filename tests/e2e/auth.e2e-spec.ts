import { compare } from "bcryptjs";
import app from "../../src";
import { loginStub, signupStub } from "../stubs";
import { drizzle } from "drizzle-orm/d1";
import { initializeLucia } from "@/utils";
import { db, lucia } from "../mocks";
import { getCookie } from "hono/cookie";

jest.mock("@/utils");
jest.mock("bcryptjs");
jest.mock("nanoid");
jest.mock("drizzle-orm/d1");
jest.mock("hono/cookie");

describe("POST /api/auth/signup (E2E)", () => {
	let d1: D1Database;
	let res: Response;

	const path = "/api/auth/signup";

	const req = {
		method: "POST",
		body: JSON.stringify(signupStub()),
		headers: {
			"Content-Type": "application/json",
			Origin: "http://localhost:8787",
		},
	};

	beforeAll(() => {
		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	it("should send status code 400 if the email or username already exists", async () => {
		db.execute.mockRejectedValueOnce({
			message: "UNIQUE constraint failed: users.email: SQLITE_CONSTRAINT",
		});
		res = await app.request(path, req, { DB: d1 });

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ message: "Email already exists" });
	});

	it("should send status code 201 with the cookie if the user is successfully created", async () => {
		res = await app.request(path, req, { DB: d1 });

		expect(res.status).toBe(201);
		expect(res.headers.get("Set-Cookie")).toBe("cookie");
		expect(await res.json()).toEqual({
			message: "User successfully created",
		});
	});
});

describe("POST /api/auth/login (E2E)", () => {
	let d1: D1Database;
	let res: Response;

	const path = "/api/auth/login";

	const req = {
		method: "POST",
		body: JSON.stringify(loginStub()),
		headers: {
			"Content-Type": "application/json",
			Origin: "http://localhost:8787",
		},
	};

	beforeAll(() => {
		db.get.mockResolvedValue({
			id: "userId",
			encryptedPassword: "encryptedPassword",
		});

		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	it("should send status code 400 if the user does not exist", async () => {
		db.get.mockResolvedValueOnce(undefined);
		res = await app.request(path, req, { DB: d1 });

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ message: "User does not exist" });
	});

	it("should send status code 400 if the login method is incorrect", async () => {
		db.get.mockResolvedValueOnce({ id: "userId", encryptedPassword: null });
		res = await app.request(path, req, { DB: d1 });

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ message: "Incorrect login method" });
	});

	it("should send status code 400 if the password is incorrect", async () => {
		(compare as jest.Mock).mockResolvedValueOnce(false);
		res = await app.request(path, req, { DB: d1 });

		expect(compare).toHaveBeenCalledWith(
			loginStub().password,
			"encryptedPassword"
		);
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ message: "Incorrect password" });
	});

	it("should send status code 200 with the cookie if the user is successfully logged in", async () => {
		res = await app.request(path, req, { DB: d1 });

		expect(res.status).toBe(200);
		expect(res.headers.get("Set-Cookie")).toBe("cookie");
		expect(await res.json()).toEqual({
			message: "User successfully logged in",
		});
	});
});

describe("POST /api/auth/logout (E2E)", () => {
	let res: Response;
	let d1: D1Database;

	const path = "/api/auth/logout";

	const req = {
		method: "POST",
		headers: {
			Origin: "http://localhost:8787",
		},
	};

	beforeAll(() => {
		(getCookie as jest.Mock).mockReturnValue("sessionId");
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	it("should send status code 401 if the user is not authenticated", async () => {
		lucia.validateSession.mockResolvedValueOnce({
			session: null,
			user: null,
		});
		res = await app.request(path, req, { DB: d1 });

		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			message: "User is not authenticated",
		});
	});

	it("should send status code 200 with the cookie if the user is successfully logged out", async () => {
		res = await app.request(path, req, { DB: d1 });

		expect(res.status).toBe(200);
		expect(res.headers.get("Set-Cookie")).toBeDefined();
		expect(await res.json()).toEqual({
			message: "User successfully logged out",
		});
	});
});
