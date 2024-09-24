import { initializeLucia } from "@/utils";
import { drizzle } from "drizzle-orm/d1";
import { loginStub, signupStub } from "../stubs";
import { db, lucia } from "../mocks";
import app from "../../src";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { usersTable } from "@/database/tables";
import { eq, or, sql } from "drizzle-orm";
import { getCookie } from "hono/cookie";

jest.mock("@/utils");
jest.mock("bcryptjs");
jest.mock("nanoid");
jest.mock("drizzle-orm/d1");
jest.mock("hono/cookie");

describe("POST /api/auth/signup", () => {
	let d1: D1Database;
	let values = {};

	beforeAll(() => {
		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	beforeEach(async () => {
		const { password, confirmPassword, ...user } = signupStub();
		values = { ...user, encryptedPassword: "hashed", id: "nanoid" };

		await app.request(
			"/api/auth/signup",
			{
				method: "POST",
				body: JSON.stringify(signupStub()),
				headers: {
					"Content-Type": "application/json",
					Origin: "http://localhost:8787",
				},
			},
			{ DB: d1 }
		);
	});

	it("should hash the password", () => {
		expect(hash).toHaveBeenCalledWith(signupStub().password, 11);
	});

	it("should generate a user id", () => {
		expect(nanoid).toHaveBeenCalledWith(25);
	});

	it("should instantiate an insert query", () => {
		expect(db.insert).toHaveBeenCalledWith(usersTable);
		expect(db.values).toHaveBeenCalledWith(
			Object.keys(values).reduce((acc: any, key) => {
				acc[key] = sql.placeholder(key);
				return acc;
			}, {})
		);
		expect(db.prepare).toHaveBeenCalled();
	});

	it("should execute the query", () => {
		expect(db.execute).toHaveBeenCalledWith(values);
	});

	it("should generate a session cookie", () => {
		expect(lucia.createSession).toHaveBeenCalledWith("nanoid", {});
		expect(lucia.createSessionCookie).toHaveBeenCalledWith("session-id");
	});
});

describe("POST /api/auth/login", () => {
	let d1: D1Database;

	beforeAll(() => {
		db.get.mockResolvedValue({
			id: "userId",
			encryptedPassword: "encryptedPassword",
		});
		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	beforeEach(async () => {
		await app.request(
			"/api/auth/login",
			{
				method: "POST",
				body: JSON.stringify(loginStub()),
				headers: {
					"Content-Type": "application/json",
					Origin: "http://localhost:8787",
				},
			},
			{ DB: d1 }
		);
	});

	it("should instantiate a select query", () => {
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
		expect(db.prepare).toHaveBeenCalled();
	});

	it("should execute the query", () => {
		expect(db.get).toHaveBeenCalledWith({ identifier: loginStub().username });
	});

	it("should create a new session", () => {
		expect(lucia.createSession).toHaveBeenCalledWith("userId", {});
		expect(lucia.createSessionCookie).toHaveBeenCalledWith("session-id");
	});
});

describe("POST /api/auth/logout", () => {
	let d1: D1Database;

	beforeAll(() => {
		(getCookie as jest.Mock).mockReturnValue("session-id");
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	beforeEach(async () => {
		await app.request(
			"/api/auth/logout",
			{
				method: "POST",
				headers: { Origin: "http://localhost:8787" },
			},
			{ DB: d1 }
		);
	});

	it("should destroy the session", () => {
		expect(lucia.invalidateSession).toHaveBeenCalledWith("session-id");
	});

	it("should clear the session cookie with a blank session", () => {
		expect(lucia.createBlankSessionCookie).toHaveBeenCalled();
	});
});
