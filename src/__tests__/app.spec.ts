import app from "../";

jest.mock("@/utils");
jest.mock("hono/cookie");
jest.mock("nanoid");

describe("/api (GET)", () => {
	let d1: D1Database;

	it("should return a message", async () => {
		const res = await app.request("/api", { method: "GET" }, { DB: d1 });

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ message: "Hello, world!" });
	});
});
