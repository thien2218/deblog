import { InferOutput, object, picklist } from "valibot";

export const PostReactionSchema = object({
	reaction: picklist(
		[
			"appreciate",
			"congrats",
			"fire",
			"strong",
			"heart",
			"wow",
			"like",
			"meh",
			"dislike",
			"angry",
		],
		"Invalid reaction for post"
	),
});

export const CommentReactionSchema = object({
	reaction: picklist(["like", "dislike"], "Invalid reaction for comment"),
});

export type PostReaction = InferOutput<typeof PostReactionSchema>["reaction"];
