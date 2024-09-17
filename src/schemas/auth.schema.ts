import {
	check,
	email,
	forward,
	maxLength,
	minLength,
	object,
	pipe,
	string,
	transform,
} from "valibot";

export const LoginSchema = object({
	username: pipe(
		string(),
		minLength(3, "Username must be at least 3 characters long"),
		maxLength(30, "Username must be at most 30 characters long")
	),
	password: pipe(
		string(),
		minLength(8, "Password must be at least 3 characters long"),
		maxLength(24, "Password must be at least 3 characters long")
	),
});

export const SignupSchema = pipe(
	object({
		name: pipe(
			string(),
			minLength(3, "Name must be at least 3 characters long"),
			maxLength(120, "Name must be at most 120 characters long")
		),
		email: pipe(string(), email("Invalid email address")),
		username: pipe(
			string(),
			minLength(3, "Username must be at least 3 characters long"),
			maxLength(30, "Username must be at most 30 characters long")
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
