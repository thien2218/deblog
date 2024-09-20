import { compare, hash } from "bcryptjs";
import app from "../";
import { loginStub, signupStub } from "./stubs";
import { nanoid } from "nanoid";
import { drizzle } from "drizzle-orm/d1";
import { initializeLucia } from "@/utils";
import { profilesTable, usersTable } from "@/database/tables";
import { eq, or, sql } from "drizzle-orm";

jest.mock("@/utils");
jest.mock("bcryptjs");
jest.mock("nanoid");
jest.mock("drizzle-orm/d1");

describe("/api/auth/signup (POST)", () => {
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

	const lucia = {
		createSession: jest.fn().mockResolvedValue({ id: "session-id" }),
		createSessionCookie: jest.fn().mockReturnValue({
			serialize: jest.fn().mockReturnValue("cookie"),
		}),
	};

	const db = {
		batch: jest.fn(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
	};

	beforeAll(() => {
		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	beforeEach(async () => {
		res = await app.request(path, req, { DB: d1 });
	});

	it("should hashes the password", () => {
		expect(hash).toHaveBeenCalledWith(signupStub().password, 12);
	});

	it("should generate a user id", () => {
		expect(nanoid).toHaveBeenCalledWith(25);
	});

	it("should batch insert the payload into user and profile table", () => {
		expect(db.batch).toHaveBeenCalledTimes(1);
		expect(db.insert).toHaveBeenNthCalledWith(1, usersTable);
		expect(db.insert).toHaveBeenNthCalledWith(2, profilesTable);
	});

	it("should create a new session for the user", () => {
		expect(lucia.createSession).toHaveBeenCalledWith("nanoid", {});
		expect(lucia.createSessionCookie).toHaveBeenCalledWith("session-id");
	});

	it("should send status code 400 if the email or username already exists", async () => {
		db.batch.mockRejectedValueOnce({
			message: "UNIQUE constraint failed: users.email: SQLITE_CONSTRAINT",
		});

		const res = await app.request(path, req, { DB: d1 });

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			error: "Bad Request",
			message: "Email already exists",
		});
	});

	it("should send status code 201 with the cookie if the user is successfully created", async () => {
		expect(res.status).toBe(201);
		expect(res.headers.get("Set-Cookie")).toBe("cookie");
		expect(await res.json()).toEqual({
			message: "User successfully created",
		});
	});
});

describe("/api/auth/login (POST)", () => {
	let d1: D1Database;
	let res: Response;

	const path = "/api/auth/login";

	const lucia = {
		createSession: jest.fn().mockResolvedValue({ id: "session-id" }),
		createSessionCookie: jest.fn().mockReturnValue({
			serialize: jest.fn().mockReturnValue("cookie"),
		}),
	};

	const db = {
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

	const req = {
		method: "POST",
		body: JSON.stringify(loginStub()),
		headers: {
			"Content-Type": "application/json",
			Origin: "http://localhost:8787",
		},
	};

	beforeAll(() => {
		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	beforeEach(async () => {
		res = await app.request(path, req, { DB: d1 });
	});

	it("should check for user in the database", () => {
		expect(db.select).toHaveBeenCalledWith({
			id: usersTable.id,
			encryptedPassword: usersTable.encryptedPassword,
		});
		expect(db.from).toHaveBeenCalledWith(usersTable);
		expect(db.where).toHaveBeenCalledWith(
			or(
				eq(usersTable.email, sql.placeholder("identifier")),
				eq(usersTable.username, sql.placeholder("identifier"))
			)
		);
		expect(db.prepare).toHaveBeenCalledTimes(1);
		expect(db.prepare().get).toHaveBeenCalledWith({
			identifier: loginStub().username,
		});
	});

	it("should send status code 400 if the user does not exist", async () => {
		db.prepare.mockReturnValueOnce({
			get: jest.fn().mockResolvedValue(undefined),
		});

		const res = await app.request(path, req, { DB: d1 });

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			error: "Bad Request",
			message: "User does not exist",
		});
	});

	it("should send status code 400 if the login method is incorrect", async () => {
		db.prepare.mockReturnValueOnce({
			get: jest.fn().mockResolvedValue({ encryptedPassword: null }),
		});

		const res = await app.request(path, req, { DB: d1 });

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			error: "Bad Request",
			message: "Incorrect login method",
		});
	});

	it("should send status code 400 if the password is incorrect", async () => {
		(compare as jest.Mock).mockResolvedValueOnce(false);
		const res = await app.request(path, req, { DB: d1 });

		expect(compare).toHaveBeenCalledWith(
			loginStub().password,
			"encryptedPassword"
		);
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			error: "Bad Request",
			message: "Incorrect password",
		});
	});

	it("should create a new session for the user", () => {
		expect(lucia.createSession).toHaveBeenCalledWith("userId", {});
		expect(lucia.createSessionCookie).toHaveBeenCalledWith("session-id");
	});

	it("should send status code 200 with the cookie if the user is successfully logged in", () => {
		expect(res.status).toBe(200);
		expect(res.headers.get("Set-Cookie")).toBe("cookie");
		expect(res.json()).resolves.toEqual({
			message: "User successfully logged in",
		});
	});
});
