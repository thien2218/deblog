import { initializeLucia } from "@/utils";
import { drizzle } from "drizzle-orm/d1";
import { db, lucia } from "../mocks";
import app from "../../src";
import { createPostStub, selectPostStub } from "../stubs";
import { getCookie } from "hono/cookie";

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

		expect(await res.json()).toEqual({ message: "No blog posts found" });
		expect(res.status).toBe(404);
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

		expect(await res.json()).toEqual({
			message: "No blog post found from the given ID: 1",
		});
		expect(res.status).toBe(404);
	});

	it("should send status 200 with the post", async () => {
		res = await app.request(path, req, { DB: d1 });
		expect(res.status).toBe(200);
	});
});

describe("POST /api/posts (E2E)", () => {
	let d1: D1Database;
	let res: Response;

	const path = "/api/posts";
	const req: RequestInit = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Origin: "http://localhost:8787",
		},
		body: JSON.stringify(createPostStub()),
	};

	beforeAll(() => {
		db.get.mockResolvedValue(selectPostStub());
		(getCookie as jest.Mock).mockReturnValue("session-id");
		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	it("should send status 401 when the user is not authenticated", async () => {
		lucia.validateSession.mockResolvedValueOnce({
			session: null,
			user: null,
		});
		res = await app.request(path, req, { DB: d1 });

		expect(await res.json()).toEqual({
			message: "User is not authenticated",
		});
		expect(res.status).toBe(401);
	});

	it("should send status 201 when the post is created", async () => {
		res = await app.request(path, req, { DB: d1 });

		expect(await res.json()).toEqual({
			message: "Blog post created successfully",
			data: createPostStub(),
		});
		expect(res.status).toBe(201);
	});
});

describe("PATCH /api/posts/:id (E2E)", () => {
	let d1: D1Database;
	let res: Response;

	const path = "/api/posts/1";
	const req: RequestInit = {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			Origin: "http://localhost:8787",
		},
		body: JSON.stringify({ title: "New Title" }),
	};

	beforeAll(() => {
		db.run.mockResolvedValue({ meta: { rows_written: 1 } });
		(getCookie as jest.Mock).mockReturnValue("session-id");
		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	it("should send status 401 when the user is not authenticated", async () => {
		lucia.validateSession.mockResolvedValueOnce({
			session: null,
			user: null,
		});
		res = await app.request(path, req, { DB: d1 });

		expect(await res.json()).toEqual({
			message: "User is not authenticated",
		});
		expect(res.status).toBe(401);
	});

	it("should send status 403 when the post is not found", async () => {
		db.run.mockResolvedValueOnce({ meta: { rows_written: 0 } });
		res = await app.request(path, req, { DB: d1 });

		expect(await res.json()).toEqual({
			message: "No blog post found from this author with the given id: 1",
		});
		expect(res.status).toBe(403);
	});

	it("should send status 204 when the post is updated", async () => {
		res = await app.request(path, req, { DB: d1 });

		expect(await res.json()).toEqual({
			message: "Blog post updated successfully",
		});
		expect(res.status).toBe(200);
	});
});

describe("DELETE /api/posts/:id (E2E)", () => {
	let d1: D1Database;
	let res: Response;

	const path = "/api/posts/1";
	const req: RequestInit = {
		method: "DELETE",
		headers: { Origin: "http://localhost:8787" },
	};

	beforeAll(() => {
		db.run.mockResolvedValue({ meta: { rows_written: 1 } });
		(getCookie as jest.Mock).mockReturnValue("session-id");
		(drizzle as jest.Mock).mockReturnValue(db);
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	it("should send status 401 when the user is not authenticated", async () => {
		lucia.validateSession.mockResolvedValueOnce({
			session: null,
			user: null,
		});
		res = await app.request(path, req, { DB: d1 });

		expect(await res.json()).toEqual({
			message: "User is not authenticated",
		});
		expect(res.status).toBe(401);
	});

	it("should send status 403 when the post is not found", async () => {
		db.run.mockResolvedValueOnce({ meta: { rows_written: 0 } });
		res = await app.request(path, req, { DB: d1 });

		expect(await res.json()).toEqual({
			message: "No blog post found from this author with the given id: 1",
		});
		expect(res.status).toBe(403);
	});

	it("should send status 204 when the post is deleted", async () => {
		res = await app.request(path, req, { DB: d1 });

		expect(await res.json()).toEqual({
			message: "Blog post deleted successfully",
		});
		expect(res.status).toBe(204);
	});
});
