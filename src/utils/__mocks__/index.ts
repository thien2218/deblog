import { StatusCode } from "hono/utils/http-status";

export const handleDbError = ({
	message,
}: {
	message: string;
}): { message: string; status: StatusCode } => {
	if (message.includes("UNIQUE")) {
		const field = message.split(".")[1].split(": ")[0];

		return {
			message: `${field.charAt(0).toUpperCase()}${field.slice(
				1
			)} already exists`,
			status: 400,
		};
	}

	return { message, status: 500 };
};

export const initializeLucia = jest.fn();
