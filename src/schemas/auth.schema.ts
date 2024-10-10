import {
	check,
	email,
	forward,
	InferInput,
	maxLength,
	minLength,
	nanoid,
	object,
	pipe,
	string,
	transform,
	union,
} from "valibot";

export const LoginSchema = object({
	identifier: union([
		pipe(
			string(),
			minLength(3, "Username must be at least 3 characters long"),
			maxLength(30, "Username must be at most 30 characters long"),
			nanoid(
				"Username can only contains the following characters: a-z, A-Z, 0-9, _, -"
			)
		),
		pipe(string(), email("Invalid email address")),
	]),
	password: pipe(
		string(),
		minLength(8, "Password must be at least 3 characters long"),
		maxLength(24, "Password must be at most 24 characters long")
	),
});

export const SignupSchema = pipe(
	object({
		email: pipe(string(), email("Invalid email address")),
		username: pipe(
			string(),
			minLength(3, "Username must be at least 3 characters long"),
			maxLength(30, "Username must be at most 30 characters long"),
			nanoid(
				"Username can only contains the following characters: a-z, A-Z, 0-9, _, -"
			)
		),
		password: pipe(
			string(),
			minLength(8, "Password must be at least 3 characters long"),
			maxLength(24, "Password must be at least 3 characters long")
		),
		confirmPassword: string(),
	}),
	forward(
		check(
			({ password, confirmPassword }) => password === confirmPassword,
			"Passwords do not match"
		),
		["confirmPassword"]
	),
	transform(({ confirmPassword, ...rest }) => rest)
);

export type LoginPayload = InferInput<typeof LoginSchema>;
export type SignupPayload = InferInput<typeof SignupSchema>;
