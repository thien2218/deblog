import {
	check,
	email,
	forward,
	maxLength,
	minLength,
	nanoid,
	object,
	optional,
	pipe,
	string,
	transform,
} from "valibot";

export const LoginSchema = pipe(
	object({
		username: optional(
			pipe(
				string(),
				minLength(3, "Username must be at least 3 characters long"),
				maxLength(30, "Username must be at most 30 characters long"),
				nanoid(
					"Username can only contains the following characters: a-z, A-Z, 0-9, _, -"
				)
			)
		),
		email: optional(pipe(string(), email("Invalid email address"))),
		password: pipe(
			string(),
			minLength(8, "Password must be at least 3 characters long"),
			maxLength(24, "Password must be at most 24 characters long")
		),
	}),
	check(
		({ username, email }) => (!!username && !email) || (!username && !!email),
		"Either username or email is required"
	),
	transform(({ username, email, password }) => {
		let identifier = (username || email) as string;
		return { identifier, password };
	})
);

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
