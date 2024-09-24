import { initializeLucia } from "@/utils";
import { drizzle } from "drizzle-orm/d1";
import { db, lucia } from "../mocks";
import app from "../../src";
import { selectPostStub } from "../stubs";

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
		db.all.mockResolvedValue([selectPostStub()]);
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

		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({ message: "No blog posts found" });
	});

	it("should send status 200 with the posts", async () => {
		res = await app.request(path, req, { DB: d1 });
		expect(res.status).toBe(200);
	});
});

describe("GET /api/posts/:id (E2E)", () => {
	let d1: D1Database;
	let res: Response;

	const path = "/api/posts/1";

	const req: RequestInit = {
		method: "GET",
		headers: { Origin: "http://localhost:8787" },
	};

	beforeAll(() => {
		db.get.mockResolvedValue(selectPostStub());
		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	it("should send status 404 when the post is not found", async () => {
		db.get.mockResolvedValueOnce(undefined);
		res = await app.request(path, req, { DB: d1 });

		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({ message: "Blog post is not found" });
	});

	it("should send status 200 with the post", async () => {
		res = await app.request(path, req, { DB: d1 });
		expect(res.status).toBe(200);
	});
});
