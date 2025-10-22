import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserRole = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		return userRole?.role || "user";
	},
});

export const checkIsAdmin = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return false;

		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		return userRole?.role === "admin";
	},
});

export const checkIsModerator = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return false;

		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		return userRole?.role === "moderator" || userRole?.role === "admin";
	},
});

export const getAllUsers = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Check if user is admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (userRole?.role !== "admin") {
			throw new Error("Only admins can view all users");
		}

		// Get all users with their roles
		const users = await ctx.db.query("users").collect();

		const usersWithRoles = await Promise.all(
			users.map(async (user) => {
				const role = await ctx.db
					.query("userRoles")
					.withIndex("by_user", (q) => q.eq("userId", user._id))
					.unique();

				return {
					...user,
					role: role?.role || "user",
					assignedBy: role?.assignedBy,
					assignedAt: role?.assignedAt,
				};
			}),
		);

		return usersWithRoles;
	},
});

export const assignRole = mutation({
	args: {
		targetUserId: v.id("users"),
		role: v.union(
			v.literal("user"),
			v.literal("moderator"),
			v.literal("admin"),
		),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Check if current user is admin
		const currentUserRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (currentUserRole?.role !== "admin") {
			throw new Error("Only admins can assign roles");
		}

		// Don't allow changing your own role
		if (userId === args.targetUserId) {
			throw new Error("Cannot change your own role");
		}

		// Check if target user exists
		const targetUser = await ctx.db.get(args.targetUserId);
		if (!targetUser) throw new Error("User not found");

		// Check if user already has a role
		const existingRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
			.unique();

		if (existingRole) {
			await ctx.db.patch(existingRole._id, {
				role: args.role,
				assignedBy: userId,
				assignedAt: Date.now(),
			});
		} else {
			await ctx.db.insert("userRoles", {
				userId: args.targetUserId,
				role: args.role,
				assignedBy: userId,
				assignedAt: Date.now(),
			});
		}

		return args.targetUserId;
	},
});

export const initializeFirstAdmin = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Check if any admin exists
		const existingAdmin = await ctx.db
			.query("userRoles")
			.withIndex("by_role", (q) => q.eq("role", "admin"))
			.first();

		if (existingAdmin) {
			throw new Error("Admin already exists");
		}

		// Make the first user an admin
		await ctx.db.insert("userRoles", {
			userId,
			role: "admin",
			assignedAt: Date.now(),
		});

		return userId;
	},
});

export const deleteUser = mutation({
	args: {
		targetUserId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Check if current user is admin
		const currentUserRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (currentUserRole?.role !== "admin") {
			throw new Error("Only admins can delete users");
		}

		// Don't allow deleting yourself
		if (userId === args.targetUserId) {
			throw new Error("Cannot delete your own account");
		}

		// Check if target user exists
		const targetUser = await ctx.db.get(args.targetUserId);
		if (!targetUser) throw new Error("User not found");

		// Delete user's role if exists
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
			.unique();

		if (userRole) {
			await ctx.db.delete(userRole._id);
		}

		// Delete user's preferences if exists
		const userPreferences = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
			.unique();

		if (userPreferences) {
			await ctx.db.delete(userPreferences._id);
		}

		// Delete user's interactions
		const interactions = await ctx.db
			.query("userInteractions")
			.withIndex("by_user_and_meme", (q) => q.eq("userId", args.targetUserId))
			.collect();

		for (const interaction of interactions) {
			await ctx.db.delete(interaction._id);
		}

		// Delete user's reports
		const reports = await ctx.db
			.query("reports")
			.withIndex("by_reporter", (q) => q.eq("reporterId", args.targetUserId))
			.collect();

		for (const report of reports) {
			await ctx.db.delete(report._id);
		}

		// Delete user's comments
		const comments = await ctx.db.query("comments").collect();

		for (const comment of comments) {
			if (comment.authorId === args.targetUserId) {
				await ctx.db.delete(comment._id);
			}
		}

		// Delete user's memes
		const memes = await ctx.db.query("memes").collect();

		for (const meme of memes) {
			if (meme.authorId === args.targetUserId) {
				await ctx.db.delete(meme._id);
			}
		}

		// Finally, delete the user
		await ctx.db.delete(args.targetUserId);

		return args.targetUserId;
	},
});
