import app from "../";

jest.mock("lucia");
jest.mock("@lucia-auth/adapter-sqlite");
jest.mock("nanoid");
jest.mock("bcryptjs");

describe("/api/auth/signup (POST)", () => {
	it("should send status code 400 upon receiving invalid email", async () => {
		const formData = new FormData();
		formData.append("username", "test");
		formData.append("password", "password");
		formData.append("email", "invalid-email");
		formData.append("name", "Test");
		formData.append("confirmPassword", "password");

		const res = await app.request("/api/auth/signup", {
			method: "POST",
			body: formData,
			headers: {
				Origin: "http://localhost:8787",
			},
		});

		expect(res.status).toBe(400);
	});
});
