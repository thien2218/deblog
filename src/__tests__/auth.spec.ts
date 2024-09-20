import { hash } from "bcryptjs";
import app from "../";
import { signupStub } from "./stubs";
import { nanoid } from "nanoid";
import { drizzle } from "drizzle-orm/d1";
import { initializeLucia } from "@/utils";
import { profilesTable, usersTable } from "@/database/tables";

jest.mock("@/utils");
jest.mock("bcryptjs");
jest.mock("nanoid");
jest.mock("drizzle-orm/d1");

describe("/api/auth/signup (POST)", () => {
	let d1: D1Database = {} as D1Database;

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

	it("should hashes the password", async () => {
		await app.request("/api/auth/signup", req, { DB: d1 });
		expect(hash).toHaveBeenCalledWith(signupStub().password, 12);
	});

	it("should generate a user id", async () => {
		await app.request("/api/auth/signup", req, { DB: d1 });
		expect(nanoid).toHaveBeenCalledWith(25);
	});

	it("should batch insert the payload into user and profile table", async () => {
		await app.request("/api/auth/signup", req, { DB: d1 });

		expect(db.batch).toHaveBeenCalledTimes(1);
		expect(db.insert).toHaveBeenNthCalledWith(1, usersTable);
		expect(db.insert).toHaveBeenNthCalledWith(2, profilesTable);
	});

	it("should create a new session for the user", async () => {
		await app.request("/api/auth/signup", req, { DB: d1 });

		expect(lucia.createSession).toHaveBeenCalledWith("nanoid", {});
		expect(lucia.createSessionCookie).toHaveBeenCalledWith("session-id");
	});

	it("should send status code 400 if the email or username already exists", async () => {
		db.batch.mockRejectedValueOnce({
			message: "UNIQUE constraint failed: users.email: SQLITE_CONSTRAINT",
		});

		const res = await app.request("/api/auth/signup", req, { DB: d1 });

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			error: "Bad Request",
			message: "Email already exists",
		});
	});

	it("should send status code 201 with the cookie if the user is successfully created", async () => {
		const res = await app.request("/api/auth/signup", req, { DB: d1 });

		expect(res.status).toBe(201);
		expect(res.headers.get("Set-Cookie")).toBe("cookie");
		expect(await res.json()).toEqual({
			message: "User successfully created",
		});
	});
});
