import { length, nanoid, pipe, string } from "valibot";

export * from "./auth.schema";
export * from "./page-query.schema";
export const NanoidSchema = pipe(
	string(),
	nanoid("ID can only contain the following characters: a-z, A-Z, 0-9, -, _"),
	length(25, "ID must be 25 characters long")
);
