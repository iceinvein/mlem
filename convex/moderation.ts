import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Issue a warning to a user
 */
export const issueWarning = mutation({
	args: {
		userId: v.id("users"),
		reason: v.string(),
		notes: v.optional(v.string()),
		relatedReportId: v.optional(v.union(v.id("reports"), v.id("userReports"))),
	},
	returns: v.id("moderationActions"),
	handler: async (ctx, args) => {
		const moderatorId = await getAuthUserId(ctx);
		if (!moderatorId) throw new Error("Must be logged in");

		// Check if user is moderator or admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", moderatorId))
			.unique();

		const role = userRole?.role || "user";
		if (role !== "moderator" && role !== "admin") {
			throw new Error("Only moderators and admins can issue warnings");
		}

		// Get or create moderation status
		let status = await ctx.db
			.query("userModerationStatus")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		if (!status) {
			const statusId = await ctx.db.insert("userModerationStatus", {
				userId: args.userId,
				warningCount: 0,
				strikeCount: 0,
				isMuted: false,
				isSuspended: false,
			});
			status = await ctx.db.get(statusId);
			if (!status) throw new Error("Failed to create moderation status");
		}

		// Create warning action
		const actionId = await ctx.db.insert("moderationActions", {
			userId: args.userId,
			moderatorId,
			actionType: "warning",
			reason: args.reason,
			notes: args.notes,
			relatedReportId: args.relatedReportId,
			isActive: true,
		});

		// Update warning count
		await ctx.db.patch(status._id, {
			warningCount: status.warningCount + 1,
			lastWarningAt: Date.now(),
		});

		return actionId;
	},
});

/**
 * Issue a strike to a user (2 strikes system)
 */
export const issueStrike = mutation({
	args: {
		userId: v.id("users"),
		reason: v.string(),
		notes: v.optional(v.string()),
		relatedReportId: v.optional(v.union(v.id("reports"), v.id("userReports"))),
	},
	returns: v.id("moderationActions"),
	handler: async (ctx, args) => {
		const moderatorId = await getAuthUserId(ctx);
		if (!moderatorId) throw new Error("Must be logged in");

		// Check if user is moderator or admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", moderatorId))
			.unique();

		const role = userRole?.role || "user";
		if (role !== "moderator" && role !== "admin") {
			throw new Error("Only moderators and admins can issue strikes");
		}

		// Get or create moderation status
		let status = await ctx.db
			.query("userModerationStatus")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		if (!status) {
			const statusId = await ctx.db.insert("userModerationStatus", {
				userId: args.userId,
				warningCount: 0,
				strikeCount: 0,
				isMuted: false,
				isSuspended: false,
			});
			status = await ctx.db.get(statusId);
			if (!status) throw new Error("Failed to create moderation status");
		}

		// Create strike action
		const actionId = await ctx.db.insert("moderationActions", {
			userId: args.userId,
			moderatorId,
			actionType: "strike",
			reason: args.reason,
			notes: args.notes,
			relatedReportId: args.relatedReportId,
			isActive: true,
		});

		// Update strike count
		const newStrikeCount = status.strikeCount + 1;
		await ctx.db.patch(status._id, {
			strikeCount: newStrikeCount,
			lastStrikeAt: Date.now(),
		});

		return actionId;
	},
});

/**
 * Mute a user (prevents posting and commenting, can still view feed)
 */
export const muteUser = mutation({
	args: {
		userId: v.id("users"),
		reason: v.string(),
		notes: v.optional(v.string()),
		relatedReportId: v.optional(v.union(v.id("reports"), v.id("userReports"))),
	},
	returns: v.id("moderationActions"),
	handler: async (ctx, args) => {
		const moderatorId = await getAuthUserId(ctx);
		if (!moderatorId) throw new Error("Must be logged in");

		// Check if user is moderator or admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", moderatorId))
			.unique();

		const role = userRole?.role || "user";
		if (role !== "moderator" && role !== "admin") {
			throw new Error("Only moderators and admins can mute users");
		}

		// Get or create moderation status
		let status = await ctx.db
			.query("userModerationStatus")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		if (!status) {
			const statusId = await ctx.db.insert("userModerationStatus", {
				userId: args.userId,
				warningCount: 0,
				strikeCount: 0,
				isMuted: false,
				isSuspended: false,
			});
			status = await ctx.db.get(statusId);
			if (!status) throw new Error("Failed to create moderation status");
		}

		// Create mute action
		const actionId = await ctx.db.insert("moderationActions", {
			userId: args.userId,
			moderatorId,
			actionType: "mute",
			reason: args.reason,
			notes: args.notes,
			relatedReportId: args.relatedReportId,
			isActive: true,
		});

		// Update mute status
		await ctx.db.patch(status._id, {
			isMuted: true,
		});

		return actionId;
	},
});

/**
 * Suspend a user for a specific duration
 */
export const suspendUser = mutation({
	args: {
		userId: v.id("users"),
		reason: v.string(),
		duration: v.union(
			v.literal("7_days"),
			v.literal("30_days"),
			v.literal("90_days"),
			v.literal("indefinite"),
		),
		notes: v.optional(v.string()),
		relatedReportId: v.optional(v.union(v.id("reports"), v.id("userReports"))),
	},
	returns: v.id("moderationActions"),
	handler: async (ctx, args) => {
		const moderatorId = await getAuthUserId(ctx);
		if (!moderatorId) throw new Error("Must be logged in");

		// Check if user is moderator or admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", moderatorId))
			.unique();

		const role = userRole?.role || "user";
		if (role !== "moderator" && role !== "admin") {
			throw new Error("Only moderators and admins can suspend users");
		}

		// Calculate expiration time
		let expiresAt: number | undefined;
		const now = Date.now();
		switch (args.duration) {
			case "7_days":
				expiresAt = now + 7 * 24 * 60 * 60 * 1000;
				break;
			case "30_days":
				expiresAt = now + 30 * 24 * 60 * 60 * 1000;
				break;
			case "90_days":
				expiresAt = now + 90 * 24 * 60 * 60 * 1000;
				break;
			case "indefinite":
				expiresAt = undefined;
				break;
		}

		// Get or create moderation status
		let status = await ctx.db
			.query("userModerationStatus")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		if (!status) {
			const statusId = await ctx.db.insert("userModerationStatus", {
				userId: args.userId,
				warningCount: 0,
				strikeCount: 0,
				isMuted: false,
				isSuspended: false,
			});
			status = await ctx.db.get(statusId);
			if (!status) throw new Error("Failed to create moderation status");
		}

		// Create suspension action
		const actionId = await ctx.db.insert("moderationActions", {
			userId: args.userId,
			moderatorId,
			actionType: "suspend",
			reason: args.reason,
			notes: args.notes,
			relatedReportId: args.relatedReportId,
			expiresAt,
			isActive: true,
		});

		// Update suspension status
		await ctx.db.patch(status._id, {
			isSuspended: true,
			suspendedUntil: expiresAt,
		});

		return actionId;
	},
});

/**
 * Unmute a user
 */
export const unmuteUser = mutation({
	args: {
		userId: v.id("users"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const moderatorId = await getAuthUserId(ctx);
		if (!moderatorId) throw new Error("Must be logged in");

		// Check if user is moderator or admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", moderatorId))
			.unique();

		const role = userRole?.role || "user";
		if (role !== "moderator" && role !== "admin") {
			throw new Error("Only moderators and admins can unmute users");
		}

		const status = await ctx.db
			.query("userModerationStatus")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		if (!status) {
			throw new Error("User has no moderation status");
		}

		// Deactivate all active mute actions
		const muteActions = await ctx.db
			.query("moderationActions")
			.withIndex("by_user_and_active", (q) =>
				q.eq("userId", args.userId).eq("isActive", true),
			)
			.filter((q) => q.eq(q.field("actionType"), "mute"))
			.collect();

		for (const action of muteActions) {
			await ctx.db.patch(action._id, { isActive: false });
		}

		// Update mute status
		await ctx.db.patch(status._id, {
			isMuted: false,
		});

		return null;
	},
});

/**
 * Unsuspend a user
 */
export const unsuspendUser = mutation({
	args: {
		userId: v.id("users"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const moderatorId = await getAuthUserId(ctx);
		if (!moderatorId) throw new Error("Must be logged in");

		// Check if user is moderator or admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", moderatorId))
			.unique();

		const role = userRole?.role || "user";
		if (role !== "moderator" && role !== "admin") {
			throw new Error("Only moderators and admins can unsuspend users");
		}

		const status = await ctx.db
			.query("userModerationStatus")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		if (!status) {
			throw new Error("User has no moderation status");
		}

		// Deactivate all active suspension actions
		const suspendActions = await ctx.db
			.query("moderationActions")
			.withIndex("by_user_and_active", (q) =>
				q.eq("userId", args.userId).eq("isActive", true),
			)
			.filter((q) => q.eq(q.field("actionType"), "suspend"))
			.collect();

		for (const action of suspendActions) {
			await ctx.db.patch(action._id, { isActive: false });
		}

		// Update suspension status
		await ctx.db.patch(status._id, {
			isSuspended: false,
			suspendedUntil: undefined,
		});

		return null;
	},
});

/**
 * Get moderation status for multiple users (for moderation panel)
 */
export const getUsersModerationStatus = query({
	args: {
		userIds: v.array(v.id("users")),
	},
	returns: v.array(
		v.object({
			userId: v.id("users"),
			status: v.union(
				v.object({
					_id: v.id("userModerationStatus"),
					userId: v.id("users"),
					warningCount: v.number(),
					strikeCount: v.number(),
					isMuted: v.boolean(),
					isSuspended: v.boolean(),
					suspendedUntil: v.optional(v.number()),
					lastWarningAt: v.optional(v.number()),
					lastStrikeAt: v.optional(v.number()),
					_creationTime: v.number(),
				}),
				v.null(),
			),
		}),
	),
	handler: async (ctx, args) => {
		const currentUserId = await getAuthUserId(ctx);
		if (!currentUserId) throw new Error("Must be logged in");

		// Check if user is moderator or admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", currentUserId))
			.unique();

		const role = userRole?.role || "user";
		if (role !== "moderator" && role !== "admin") {
			throw new Error("Only moderators and admins can view moderation status");
		}

		const results = await Promise.all(
			args.userIds.map(async (userId) => {
				const status = await ctx.db
					.query("userModerationStatus")
					.withIndex("by_user", (q) => q.eq("userId", userId))
					.unique();

				return {
					userId,
					status,
				};
			}),
		);

		return results;
	},
});

/**
 * Get moderation status for a user
 */
export const getUserModerationStatus = query({
	args: {
		userId: v.id("users"),
	},
	returns: v.union(
		v.object({
			_id: v.id("userModerationStatus"),
			userId: v.id("users"),
			warningCount: v.number(),
			strikeCount: v.number(),
			isMuted: v.boolean(),
			isSuspended: v.boolean(),
			suspendedUntil: v.optional(v.number()),
			lastWarningAt: v.optional(v.number()),
			lastStrikeAt: v.optional(v.number()),
			_creationTime: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const status = await ctx.db
			.query("userModerationStatus")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		return status;
	},
});

/**
 * Get moderation history for a user
 */
export const getUserModerationHistory = query({
	args: {
		userId: v.id("users"),
	},
	returns: v.array(
		v.object({
			_id: v.id("moderationActions"),
			userId: v.id("users"),
			moderatorId: v.id("users"),
			actionType: v.union(
				v.literal("warning"),
				v.literal("strike"),
				v.literal("mute"),
				v.literal("suspend"),
			),
			reason: v.string(),
			notes: v.optional(v.string()),
			relatedReportId: v.optional(
				v.union(v.id("reports"), v.id("userReports")),
			),
			expiresAt: v.optional(v.number()),
			isActive: v.boolean(),
			_creationTime: v.number(),
			moderator: v.union(
				v.object({
					_id: v.id("users"),
					name: v.optional(v.string()),
					email: v.optional(v.string()),
				}),
				v.null(),
			),
		}),
	),
	handler: async (ctx, args) => {
		const currentUserId = await getAuthUserId(ctx);
		if (!currentUserId) throw new Error("Must be logged in");

		// Check if user is moderator or admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", currentUserId))
			.unique();

		const role = userRole?.role || "user";
		if (role !== "moderator" && role !== "admin") {
			throw new Error("Only moderators and admins can view moderation history");
		}

		const actions = await ctx.db
			.query("moderationActions")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.order("desc")
			.collect();

		const actionsWithModerators = await Promise.all(
			actions.map(async (action) => {
				const moderator = await ctx.db.get(action.moderatorId);
				return {
					...action,
					moderator: moderator
						? {
								_id: moderator._id,
								name: moderator.name,
								email: moderator.email,
							}
						: null,
				};
			}),
		);

		return actionsWithModerators;
	},
});

/**
 * Get active warnings for current user
 */
export const getMyActiveWarnings = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("moderationActions"),
			actionType: v.union(
				v.literal("warning"),
				v.literal("strike"),
				v.literal("mute"),
				v.literal("suspend"),
			),
			reason: v.string(),
			notes: v.optional(v.string()),
			expiresAt: v.optional(v.number()),
			seenByUser: v.optional(v.boolean()),
			_creationTime: v.number(),
		}),
	),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		// Get all active moderation actions for this user
		const actions = await ctx.db
			.query("moderationActions")
			.withIndex("by_user_and_active", (q) =>
				q.eq("userId", userId).eq("isActive", true),
			)
			.order("desc")
			.collect();

		return actions.map((action) => ({
			_id: action._id,
			actionType: action.actionType,
			reason: action.reason,
			notes: action.notes,
			expiresAt: action.expiresAt,
			seenByUser: action.seenByUser,
			_creationTime: action._creationTime,
		}));
	},
});

/**
 * Mark warnings as seen
 */
export const markWarningsAsSeen = mutation({
	args: {
		warningIds: v.array(v.id("moderationActions")),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		for (const warningId of args.warningIds) {
			const warning = await ctx.db.get(warningId);
			if (!warning) continue;

			// Verify this warning belongs to the current user
			if (warning.userId !== userId) continue;

			// Mark as seen
			await ctx.db.patch(warningId, {
				seenByUser: true,
			});
		}

		return null;
	},
});

/**
 * Dismiss a warning (mark as acknowledged)
 */
export const dismissWarning = mutation({
	args: {
		warningId: v.id("moderationActions"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		const warning = await ctx.db.get(args.warningId);
		if (!warning) throw new Error("Warning not found");

		// Verify this warning belongs to the current user
		if (warning.userId !== userId) {
			throw new Error("Not authorized to dismiss this warning");
		}

		// Only warnings can be dismissed by users
		if (warning.actionType !== "warning") {
			throw new Error("Only warnings can be dismissed");
		}

		// Mark as inactive (acknowledged)
		await ctx.db.patch(args.warningId, {
			isActive: false,
		});

		return null;
	},
});

/**
 * Check if current user is suspended or muted (for auth and UI checks)
 */
export const checkSuspensionStatus = query({
	args: {},
	returns: v.object({
		isSuspended: v.boolean(),
		isMuted: v.boolean(),
		reason: v.optional(v.string()),
		suspendedUntil: v.optional(v.number()),
	}),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return { isSuspended: false, isMuted: false };
		}

		const status = await ctx.db
			.query("userModerationStatus")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (!status) {
			return { isSuspended: false, isMuted: false };
		}

		// Check if muted
		if (status.isMuted) {
			return {
				isSuspended: false,
				isMuted: true,
				reason: "You are muted and cannot post or comment",
			};
		}

		// Check if suspended
		if (status.isSuspended) {
			// Check if suspension has expired
			if (status.suspendedUntil && status.suspendedUntil < Date.now()) {
				return { isSuspended: false, isMuted: false };
			}

			return {
				isSuspended: true,
				isMuted: false,
				reason: status.suspendedUntil
					? `Your account is suspended until ${new Date(status.suspendedUntil).toLocaleDateString()}`
					: "Your account is suspended indefinitely",
				suspendedUntil: status.suspendedUntil,
			};
		}

		return { isSuspended: false, isMuted: false };
	},
});

/**
 * Clear expired suspensions (called during login check)
 */
export const clearExpiredSuspension = mutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const status = await ctx.db
			.query("userModerationStatus")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (!status || !status.isSuspended) return null;

		// Check if suspension has expired
		if (status.suspendedUntil && status.suspendedUntil < Date.now()) {
			// Clear the suspension
			await ctx.db.patch(status._id, {
				isSuspended: false,
				suspendedUntil: undefined,
			});

			// Deactivate suspension actions
			const suspendActions = await ctx.db
				.query("moderationActions")
				.withIndex("by_user_and_active", (q) =>
					q.eq("userId", userId).eq("isActive", true),
				)
				.filter((q) => q.eq(q.field("actionType"), "suspend"))
				.collect();

			for (const action of suspendActions) {
				await ctx.db.patch(action._id, { isActive: false });
			}
		}

		return null;
	},
});

/**
 * Check if user can post (not muted or suspended)
 */
export const canUserPost = query({
	args: {
		userId: v.id("users"),
	},
	returns: v.object({
		canPost: v.boolean(),
		reason: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		const status = await ctx.db
			.query("userModerationStatus")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		if (!status) {
			return { canPost: true };
		}

		// Check if suspended
		if (status.isSuspended) {
			if (status.suspendedUntil && status.suspendedUntil < Date.now()) {
				// Suspension expired - note: queries can't update, this will be handled in mutations
				return { canPost: true };
			}
			return {
				canPost: false,
				reason: status.suspendedUntil
					? `Suspended until ${new Date(status.suspendedUntil).toLocaleDateString()}`
					: "Suspended indefinitely",
			};
		}

		// Check if muted
		if (status.isMuted) {
			return {
				canPost: false,
				reason: "You are muted and cannot post or comment",
			};
		}

		return { canPost: true };
	},
});
