import { initializeLucia } from "@/utils";
import app from "../../";
import { lucia } from "./mocks";

jest.mock("@/utils");
jest.mock("hono/cookie");
jest.mock("nanoid");

describe("/api (GET)", () => {
	let d1: D1Database;

	beforeAll(() => {
		(initializeLucia as jest.Mock).mockReturnValue(lucia);
	});

	it("should return a message", async () => {
		const res = await app.request("/api", { method: "GET" }, { DB: d1 });

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ message: "Hello, world!" });
	});
});
