import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const updateUsername = mutation({
	args: {
		newUsername: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Check if user has already changed their username
		const metadata = await ctx.db
			.query("userMetadata")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (metadata?.hasChangedUsername) {
			throw new Error("You have already used your one-time username change");
		}

		// Validate username
		const username = args.newUsername.trim();
		if (username.length < 3) {
			throw new Error("Username must be at least 3 characters");
		}
		if (username.length > 30) {
			throw new Error("Username must be less than 30 characters");
		}
		if (!/^[a-zA-Z0-9_]+$/.test(username)) {
			throw new Error(
				"Username can only contain letters, numbers, and underscores",
			);
		}

		// Check if username is already taken
		const existingUser = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("name"), username))
			.first();

		if (existingUser && existingUser._id !== userId) {
			throw new Error("Username is already taken");
		}

		// Update username
		await ctx.db.patch(userId, { name: username });

		// Mark username as changed
		if (metadata) {
			await ctx.db.patch(metadata._id, {
				hasChangedUsername: true,
				usernameChangedAt: Date.now(),
			});
		} else {
			// Create metadata if it doesn't exist (for existing users)
			await ctx.db.insert("userMetadata", {
				userId,
				hasChangedUsername: true,
				usernameChangedAt: Date.now(),
			});
		}

		return null;
	},
});

export const getCurrentUser = query({
	args: {},
	returns: v.union(
		v.object({
			_id: v.id("users"),
			name: v.optional(v.string()),
			email: v.optional(v.string()),
			canChangeUsername: v.boolean(),
		}),
		v.null(),
	),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const user = await ctx.db.get(userId);
		if (!user) return null;

		// Check if user can still change their username
		const metadata = await ctx.db
			.query("userMetadata")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		const canChangeUsername = !metadata?.hasChangedUsername;

		return {
			_id: user._id,
			name: user.name,
			email: user.email,
			canChangeUsername,
		};
	},
});

export const getUserProfile = query({
	args: {
		userId: v.id("users"),
	},
	returns: v.union(
		v.object({
			_id: v.id("users"),
			name: v.optional(v.string()),
			email: v.optional(v.string()),
			_creationTime: v.number(),
			totalPosts: v.number(),
			totalLikes: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) return null;

		// Get user's memes
		const memes = await ctx.db
			.query("memes")
			.filter((q) => q.eq(q.field("authorId"), args.userId))
			.collect();

		const totalPosts = memes.length;
		const totalLikes = memes.reduce((sum, meme) => sum + meme.likes, 0);

		return {
			_id: user._id,
			name: user.name,
			email: user.email,
			_creationTime: user._creationTime,
			totalPosts,
			totalLikes,
		};
	},
});

export const getUserMemes = query({
	args: {
		userId: v.id("users"),
	},
	returns: v.array(
		v.object({
			_id: v.id("memes"),
			title: v.string(),
			imageUrl: v.string(),
			likes: v.number(),
			shares: v.number(),
			comments: v.number(),
			categoryId: v.id("categories"),
			tags: v.array(v.string()),
			_creationTime: v.number(),
			category: v.union(
				v.object({
					name: v.string(),
				}),
				v.null(),
			),
			contentType: v.union(v.literal("image"), v.literal("video")),
		}),
	),
	handler: async (ctx, args) => {
		const memes = await ctx.db
			.query("memes")
			.filter((q) => q.eq(q.field("authorId"), args.userId))
			.order("desc")
			.collect();

		const results = await Promise.all(
			memes.map(async (meme) => {
				const category = await ctx.db.get(meme.categoryId);

				let imageUrl = meme.imageUrl;
				if (meme.imageUrl && !meme.imageUrl.startsWith("http")) {
					const storageId = meme.imageUrl as Id<"_storage">;
					const storageUrl = await ctx.storage.getUrl(storageId);
					if (storageUrl) {
						imageUrl = storageUrl;
					}
				}

				return {
					_id: meme._id,
					title: meme.title,
					imageUrl,
					likes: meme.likes,
					shares: meme.shares,
					comments: meme.comments || 0,
					categoryId: meme.categoryId,
					tags: meme.tags,
					_creationTime: meme._creationTime,
					category: category
						? {
								name: category.name,
							}
						: null,
					contentType: meme.contentType || "image",
				};
			}),
		);

		return results;
	},
});
