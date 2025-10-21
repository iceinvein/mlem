import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
      })
    );

    return usersWithRoles;
  },
});

export const assignRole = mutation({
  args: {
    targetUserId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("moderator"), v.literal("admin")),
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
