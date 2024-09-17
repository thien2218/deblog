import app from "../";

jest.mock("lucia");
jest.mock("@lucia-auth/adapter-sqlite");
jest.mock("nanoid");

describe("/api (GET)", () => {
	it("should return a message", async () => {
		const res = await app.request("/api", {
			method: "GET",
		});

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ message: "Hello, world!" });
	});
});
