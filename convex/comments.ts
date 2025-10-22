import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getComments = query({
	args: { memeId: v.id("memes") },
	handler: async (ctx, args) => {
		const comments = await ctx.db
			.query("comments")
			.withIndex("by_meme", (q) => q.eq("memeId", args.memeId))
			.filter((q) => q.eq(q.field("parentId"), undefined))
			.order("desc")
			.collect();

		const commentsWithAuthors = await Promise.all(
			comments.map(async (comment) => {
				const author = await ctx.db.get(comment.authorId);
				const replies = await ctx.db
					.query("comments")
					.withIndex("by_parent", (q) => q.eq("parentId", comment._id))
					.order("asc")
					.collect();

				const repliesWithAuthors = await Promise.all(
					replies.map(async (reply) => {
						const replyAuthor = await ctx.db.get(reply.authorId);
						return {
							...reply,
							author: replyAuthor,
						};
					}),
				);

				return {
					...comment,
					author,
					replies: repliesWithAuthors,
				};
			}),
		);

		return commentsWithAuthors;
	},
});

export const addComment = mutation({
	args: {
		memeId: v.id("memes"),
		content: v.string(),
		parentId: v.optional(v.id("comments")),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		const commentId = await ctx.db.insert("comments", {
			memeId: args.memeId,
			authorId: userId,
			content: args.content,
			parentId: args.parentId,
		});

		// Update comment count on meme
		const meme = await ctx.db.get(args.memeId);
		if (meme) {
			await ctx.db.patch(args.memeId, {
				comments: (meme.comments || 0) + 1,
			});
		}

		return commentId;
	},
});

export const deleteComment = mutation({
	args: { commentId: v.id("comments") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		const comment = await ctx.db.get(args.commentId);
		if (!comment) throw new Error("Comment not found");

		if (comment.authorId !== userId) {
			throw new Error("Not authorized to delete this comment");
		}

		await ctx.db.delete(args.commentId);

		// Update comment count on meme
		const meme = await ctx.db.get(comment.memeId);
		if (meme) {
			await ctx.db.patch(comment.memeId, {
				comments: Math.max(0, (meme.comments || 0) - 1),
			});
		}
	},
});
