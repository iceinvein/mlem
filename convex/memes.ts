import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const getCategories = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("categories").collect();
	},
});

export const getFeed = query({
	args: {
		categoryId: v.optional(v.id("categories")),
		sortBy: v.optional(v.union(v.literal("newest"), v.literal("popular"))),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		const sortBy = args.sortBy || "newest";

		// Get muted users list if user is logged in
		let mutedUserIds: Array<Id<"users">> = [];
		if (userId) {
			const mutedUsers = await ctx.db
				.query("mutedUsers")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.collect();
			mutedUserIds = mutedUsers.map((m) => m.mutedUserId);
		}

		// biome-ignore lint: paginatedResult type is inferred
		let paginatedResult;

		if (args.categoryId) {
			const categoryId: Id<"categories"> = args.categoryId;
			paginatedResult = await ctx.db
				.query("memes")
				.withIndex("by_category", (q) => q.eq("categoryId", categoryId))
				.order("desc")
				.paginate(args.paginationOpts);
		} else if (sortBy === "popular") {
			paginatedResult = await ctx.db
				.query("memes")
				.withIndex("by_likes")
				.order("desc")
				.paginate(args.paginationOpts);
		} else {
			paginatedResult = await ctx.db
				.query("memes")
				.order("desc")
				.paginate(args.paginationOpts);
		}

		// Filter out memes from muted users
		const memes = paginatedResult.page.filter(
			(meme) =>
				!meme.authorId || !mutedUserIds.includes(meme.authorId as Id<"users">),
		);

		// Sort by popularity if needed and category filter is applied
		if (args.categoryId && sortBy === "popular") {
			memes.sort(
				(a: { likes: number }, b: { likes: number }) => b.likes - a.likes,
			);
		}

		// Fetch interactions, categories, and author info in parallel
		const results = await Promise.all(
			memes.map(async (meme) => {
				const category = await ctx.db.get(meme.categoryId);
				const author = meme.authorId ? await ctx.db.get(meme.authorId) : null;
				let userLiked = false;
				let userShared = false;

				if (userId) {
					const interactions = await ctx.db
						.query("userInteractions")
						.withIndex("by_user_and_meme", (q) =>
							q.eq("userId", userId).eq("memeId", meme._id),
						)
						.collect();

					userLiked = interactions.some((i) => i.type === "like");
					userShared = interactions.some((i) => i.type === "share");
				}

				let imageUrl = meme.imageUrl;
				if (meme.imageUrl && !meme.imageUrl.startsWith("http")) {
					const storageId: Id<"_storage"> = meme.imageUrl as Id<"_storage">;
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
					comments: meme.comments,
					userLiked,
					userShared,
					categoryId: meme.categoryId,
					tags: meme.tags,
					_creationTime: meme._creationTime,
					authorId: meme.authorId,
					category,
					author: author
						? {
								name: author.name,
								email: author.email,
							}
						: null,
				};
			}),
		);

		return {
			page: results,
			isDone: paginatedResult.isDone,
			continueCursor: paginatedResult.continueCursor,
		};
	},
});

export const getUserPreferences = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const preferences = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		return preferences;
	},
});

export const updateUserPreferences = mutation({
	args: {
		favoriteCategories: v.array(v.id("categories")),
		feedSettings: v.object({
			sortBy: v.union(v.literal("newest"), v.literal("popular")),
			showOnlyFavorites: v.boolean(),
		}),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		const existing = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				favoriteCategories: args.favoriteCategories,
				feedSettings: args.feedSettings,
			});
		} else {
			await ctx.db.insert("userPreferences", {
				userId,
				favoriteCategories: args.favoriteCategories,
				feedSettings: args.feedSettings,
			});
		}
	},
});

export const toggleLike = mutation({
	args: { memeId: v.id("memes") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		const existing = await ctx.db
			.query("userInteractions")
			.withIndex("by_user_and_meme", (q) =>
				q.eq("userId", userId).eq("memeId", args.memeId),
			)
			.filter((q) => q.eq(q.field("type"), "like"))
			.unique();

		const meme = await ctx.db.get(args.memeId);
		if (!meme) throw new Error("Meme not found");

		if (existing) {
			// Unlike
			await ctx.db.delete(existing._id);
			await ctx.db.patch(args.memeId, { likes: meme.likes - 1 });
		} else {
			// Like
			await ctx.db.insert("userInteractions", {
				userId,
				memeId: args.memeId,
				type: "like",
			});
			await ctx.db.patch(args.memeId, { likes: meme.likes + 1 });
		}
	},
});

export const shareMeme = mutation({
	args: { memeId: v.id("memes") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		const existing = await ctx.db
			.query("userInteractions")
			.withIndex("by_user_and_meme", (q) =>
				q.eq("userId", userId).eq("memeId", args.memeId),
			)
			.filter((q) => q.eq(q.field("type"), "share"))
			.unique();

		if (!existing) {
			await ctx.db.insert("userInteractions", {
				userId,
				memeId: args.memeId,
				type: "share",
			});

			const meme = await ctx.db.get(args.memeId);
			if (meme) {
				await ctx.db.patch(args.memeId, { shares: meme.shares + 1 });
			}
		}
	},
});

// Seed initial categories
export const seedCategories = mutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		// Check if categories already exist
		const existingCategories = await ctx.db.query("categories").collect();
		if (existingCategories.length > 0) return null;

		// Create initial categories
		const categories = [
			{ name: "Funny" },
			{ name: "Animals" },
			{ name: "Gaming" },
			{ name: "Tech" },
			{ name: "Sports" },
			{ name: "Movies" },
			{ name: "Food" },
			{ name: "Travel" },
		];

		for (const category of categories) {
			await ctx.db.insert("categories", category);
		}

		return null;
	},
});

export const createMeme = mutation({
	args: {
		title: v.string(),
		imageUrl: v.string(),
		categoryId: v.id("categories"),
		tags: v.array(v.string()),
	},
	returns: v.id("memes"),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Rate limiting: Check if user is admin/moderator (they get unlimited posts)
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		const isModeratorOrAdmin =
			userRole?.role === "moderator" || userRole?.role === "admin";

		if (!isModeratorOrAdmin) {
			// For regular users, check rate limit
			const oneHourAgo = Date.now() - 60 * 60 * 1000; // 1 hour in milliseconds

			const recentMemes = await ctx.db
				.query("memes")
				.filter((q) =>
					q.and(
						q.eq(q.field("authorId"), userId),
						q.gte(q.field("_creationTime"), oneHourAgo),
					),
				)
				.collect();

			const RATE_LIMIT = 5; // 5 memes per hour for regular users

			if (recentMemes.length >= RATE_LIMIT) {
				throw new Error(
					`Rate limit exceeded. You can only post ${RATE_LIMIT} memes per hour. Please try again later.`,
				);
			}
		}

		const memeId = await ctx.db.insert("memes", {
			title: args.title,
			imageUrl: args.imageUrl,
			categoryId: args.categoryId,
			authorId: userId,
			likes: 0,
			shares: 0,
			comments: 0,
			tags: args.tags,
		});

		return memeId;
	},
});

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

export const getRateLimitStatus = query({
	args: {},
	returns: v.object({
		postsInLastHour: v.number(),
		limit: v.number(),
		remaining: v.number(),
		isLimited: v.boolean(),
		resetTime: v.optional(v.number()),
	}),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return {
				postsInLastHour: 0,
				limit: 5,
				remaining: 5,
				isLimited: false,
			};
		}

		// Check if user is admin/moderator (unlimited posts)
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		const isModeratorOrAdmin =
			userRole?.role === "moderator" || userRole?.role === "admin";

		if (isModeratorOrAdmin) {
			return {
				postsInLastHour: 0,
				limit: 999,
				remaining: 999,
				isLimited: false,
			};
		}

		// For regular users, check rate limit
		const oneHourAgo = Date.now() - 60 * 60 * 1000;

		const recentMemes = await ctx.db
			.query("memes")
			.filter((q) =>
				q.and(
					q.eq(q.field("authorId"), userId),
					q.gte(q.field("_creationTime"), oneHourAgo),
				),
			)
			.collect();

		const RATE_LIMIT = 5;
		const postsInLastHour = recentMemes.length;
		const remaining = Math.max(0, RATE_LIMIT - postsInLastHour);

		// Find the oldest post to calculate reset time
		let resetTime: number | undefined;
		if (recentMemes.length > 0) {
			const oldestPost = recentMemes.reduce((oldest, current) =>
				current._creationTime < oldest._creationTime ? current : oldest,
			);
			resetTime = oldestPost._creationTime + 60 * 60 * 1000; // 1 hour after oldest post
		}

		return {
			postsInLastHour,
			limit: RATE_LIMIT,
			remaining,
			isLimited: remaining === 0,
			resetTime,
		};
	},
});

// Admin category management
export const createCategory = mutation({
	args: {
		name: v.string(),
	},
	returns: v.id("categories"),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Check if user is admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (!userRole || userRole.role !== "admin") {
			throw new Error("Only admins can create categories");
		}

		return await ctx.db.insert("categories", {
			name: args.name,
		});
	},
});

export const updateCategory = mutation({
	args: {
		categoryId: v.id("categories"),
		name: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Check if user is admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (!userRole || userRole.role !== "admin") {
			throw new Error("Only admins can update categories");
		}

		await ctx.db.patch(args.categoryId, {
			name: args.name,
		});

		return null;
	},
});

export const deleteCategory = mutation({
	args: {
		categoryId: v.id("categories"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Check if user is admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (!userRole || userRole.role !== "admin") {
			throw new Error("Only admins can delete categories");
		}

		// Check if any memes use this category
		const memesWithCategory = await ctx.db
			.query("memes")
			.withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
			.first();

		if (memesWithCategory) {
			throw new Error(
				"Cannot delete category that has memes. Please reassign or delete memes first.",
			);
		}

		await ctx.db.delete(args.categoryId);
		return null;
	},
});

export const deleteMeme = mutation({
	args: {
		memeId: v.id("memes"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		const meme = await ctx.db.get(args.memeId);
		if (!meme) throw new Error("Meme not found");

		// Check if user is the author
		if (meme.authorId !== userId) {
			throw new Error("You can only delete your own memes");
		}

		// Delete all related data
		// 1. Delete all comments on this meme
		const comments = await ctx.db
			.query("comments")
			.withIndex("by_meme", (q) => q.eq("memeId", args.memeId))
			.collect();
		for (const comment of comments) {
			await ctx.db.delete(comment._id);
		}

		// 2. Delete all user interactions (likes, shares)
		const interactions = await ctx.db
			.query("userInteractions")
			.withIndex("by_meme", (q) => q.eq("memeId", args.memeId))
			.collect();
		for (const interaction of interactions) {
			await ctx.db.delete(interaction._id);
		}

		// 3. Delete all reports for this meme
		const reports = await ctx.db
			.query("reports")
			.withIndex("by_meme", (q) => q.eq("memeId", args.memeId))
			.collect();
		for (const report of reports) {
			await ctx.db.delete(report._id);
		}

		// 4. Delete the meme itself
		await ctx.db.delete(args.memeId);

		return null;
	},
});

export const getSingleMeme = query({
	args: {
		memeId: v.id("memes"),
	},
	returns: v.union(
		v.object({
			_id: v.id("memes"),
			title: v.string(),
			imageUrl: v.string(),
			likes: v.number(),
			shares: v.number(),
			comments: v.number(),
			userLiked: v.boolean(),
			userShared: v.boolean(),
			categoryId: v.id("categories"),
			tags: v.array(v.string()),
			_creationTime: v.number(),
			authorId: v.optional(v.id("users")),
			category: v.union(
				v.object({
					name: v.string(),
				}),
				v.null(),
			),
			author: v.union(
				v.object({
					name: v.optional(v.string()),
					email: v.optional(v.string()),
				}),
				v.null(),
			),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);

		const meme = await ctx.db.get(args.memeId);
		if (!meme) return null;

		const category = await ctx.db.get(meme.categoryId);
		const author = meme.authorId ? await ctx.db.get(meme.authorId) : null;

		let userLiked = false;
		let userShared = false;

		if (userId) {
			const interactions = await ctx.db
				.query("userInteractions")
				.withIndex("by_user_and_meme", (q) =>
					q.eq("userId", userId).eq("memeId", meme._id),
				)
				.collect();

			userLiked = interactions.some((i) => i.type === "like");
			userShared = interactions.some((i) => i.type === "share");
		}

		let imageUrl = meme.imageUrl;
		if (meme.imageUrl && !meme.imageUrl.startsWith("http")) {
			const storageId: Id<"_storage"> = meme.imageUrl as Id<"_storage">;
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
			userLiked,
			userShared,
			categoryId: meme.categoryId,
			tags: meme.tags,
			_creationTime: meme._creationTime,
			authorId: meme.authorId,
			category: category
				? {
						name: category.name,
					}
				: null,
			author: author
				? {
						name: author.name,
						email: author.email,
					}
				: null,
		};
	},
});
