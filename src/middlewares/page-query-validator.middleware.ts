import { PageQuerySchema } from "@/schemas";
import { vValidator } from "@hono/valibot-validator";

const pageQueryValidator = vValidator("query", PageQuerySchema, (result, c) => {
	if (!result.success) {
		return c.json({ message: result.issues[0].message }, 400);
	}
});

export default pageQueryValidator;
