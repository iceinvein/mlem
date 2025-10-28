import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getComments = query({
	args: { memeId: v.id("memes") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);

		// Get muted users list if user is logged in
		const mutedUserIds: Array<string> = [];
		if (userId) {
			const mutedUsers = await ctx.db
				.query("mutedUsers")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.collect();
			mutedUserIds.push(...mutedUsers.map((m) => m.mutedUserId));
		}

		const comments = await ctx.db
			.query("comments")
			.withIndex("by_meme", (q) => q.eq("memeId", args.memeId))
			.filter((q) => q.eq(q.field("parentId"), undefined))
			.order("desc")
			.collect();

		// Filter out comments from muted users
		const filteredComments = comments.filter(
			(comment) => !mutedUserIds.includes(comment.authorId),
		);

		const commentsWithAuthors = await Promise.all(
			filteredComments.map(async (comment) => {
				const author = await ctx.db.get(comment.authorId);
				const replies = await ctx.db
					.query("comments")
					.withIndex("by_parent", (q) => q.eq("parentId", comment._id))
					.order("asc")
					.collect();

				// Filter out replies from muted users
				const filteredReplies = replies.filter(
					(reply) => !mutedUserIds.includes(reply.authorId),
				);

				const repliesWithAuthors = await Promise.all(
					filteredReplies.map(async (reply) => {
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

		// Check moderation status
		const moderationStatus = await ctx.db
			.query("userModerationStatus")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (moderationStatus) {
			// Check if suspended
			if (moderationStatus.isSuspended) {
				if (
					moderationStatus.suspendedUntil &&
					moderationStatus.suspendedUntil < Date.now()
				) {
					// Suspension expired, update status
					await ctx.db.patch(moderationStatus._id, {
						isSuspended: false,
						suspendedUntil: undefined,
					});
				} else {
					throw new Error(
						moderationStatus.suspendedUntil
							? `Your account is suspended until ${new Date(moderationStatus.suspendedUntil).toLocaleDateString()}`
							: "Your account is suspended indefinitely",
					);
				}
			}

			// Check if muted
			if (moderationStatus.isMuted) {
				throw new Error("You are muted and cannot comment");
			}
		}

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
