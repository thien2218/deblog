import { LoginPayload, SignupPayload } from "@/schemas";

export const signupStub = (): SignupPayload => ({
	email: "test@gmail.com",
	password: "password",
	confirmPassword: "password",
	name: "Test User",
	username: "test",
});

export const loginStub = (): LoginPayload => ({
	username: "test",
	password: "password",
});
