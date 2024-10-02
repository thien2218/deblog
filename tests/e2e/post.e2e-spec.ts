import { initializeLucia } from "@/utils";
import { drizzle } from "drizzle-orm/d1";
import { db, lucia, r2 } from "../mocks";
import app from "../../src";
import { selectPostsStub } from "../stubs";

jest.mock("@/utils");
jest.mock("bcryptjs");
jest.mock("nanoid");
jest.mock("drizzle-orm/d1");
jest.mock("hono/cookie");

describe("GET /api/posts (E2E)", () => {
	let d1: D1Database;
	let res: Response;

	const path = "/api/posts?limit=10&page=1";
	const invalidPath = "/api/posts?limit=a&page=b";

	const req: RequestInit = {
		method: "GET",
		headers: { Origin: "http://localhost:8787" },
	};

	beforeAll(() => {
		db.all.mockResolvedValue(selectPostsStub());
		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	it("should send status 400 when query param(s) is invalid", async () => {
		res = await app.request(invalidPath, req, { DB: d1 });
		expect(res.status).toBe(400);
	});

	it("should send status 404 when no posts are found", async () => {
		db.all.mockResolvedValueOnce([]);
		res = await app.request(path, req, { DB: d1 });

		expect(await res.json()).toEqual({
			message: "No blog posts found",
			state: "success",
		});
		expect(res.status).toBe(404);
	});

	it("should send status 200 with the posts", async () => {
		res = await app.request(path, req, { DB: d1 });
		expect(res.status).toBe(200);
	});
});

describe("POST /api/posts (E2E)", () => {
	let res: Response;

	const path = "/api/posts/draft";
	const req: RequestInit = {
		method: "POST",
		headers: { Origin: "http://localhost:8787" },
	};

	beforeAll(() => {
		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	it("should send status 401 when the user is not authenticated", async () => {
		lucia.validateSession.mockResolvedValueOnce({
			session: null,
			user: null,
		});
		res = await app.request(path, req, { DB: {}, POSTS_BUCKET: r2 });

		expect(await res.json()).toEqual({
			message: "User is not logged in",
			state: "error",
		});
		expect(res.status).toBe(401);
	});

	it("should send status 201 when the post is created", async () => {
		res = await app.request(path, req, { DB: {}, POSTS_BUCKET: r2 });

		expect(await res.json()).toEqual({
			message: "Draft created successfully",
			state: "success",
			output: { id: "nanoid" },
		});
		expect(res.status).toBe(201);
	});
});
