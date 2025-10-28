import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

/**
 * Report a user for inappropriate behavior
 */
export const reportUser = mutation({
	args: {
		reportedUserId: v.id("users"),
		reason: v.union(
			v.literal("spam"),
			v.literal("harassment"),
			v.literal("inappropriate_content"),
			v.literal("impersonation"),
			v.literal("other"),
		),
		description: v.optional(v.string()),
	},
	returns: v.id("userReports"),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in to report users");

		// Can't report yourself
		if (userId === args.reportedUserId) {
			throw new Error("You cannot report yourself");
		}

		// Check if user already reported this user
		const existingReport = await ctx.db
			.query("userReports")
			.withIndex("by_reported_user", (q) =>
				q.eq("reportedUserId", args.reportedUserId),
			)
			.filter((q) => q.eq(q.field("reporterId"), userId))
			.first();

		if (existingReport) {
			// Provide different messages based on report status
			if (existingReport.status === "pending") {
				throw new Error(
					"Your report has already been submitted and is pending review",
				);
			}
			if (existingReport.status === "reviewed") {
				throw new Error(
					"Your report has been submitted and is currently under review",
				);
			}
			if (existingReport.status === "resolved") {
				throw new Error(
					"You have already reported this user. The report was reviewed and resolved by our moderation team",
				);
			}
			if (existingReport.status === "dismissed") {
				throw new Error(
					"You have already reported this user. The report was reviewed and dismissed by our moderation team",
				);
			}
			// Fallback for any other status
			throw new Error("You have already reported this user");
		}

		// Verify reported user exists
		const reportedUser = await ctx.db.get(args.reportedUserId);
		if (!reportedUser) throw new Error("User not found");

		const reportId = await ctx.db.insert("userReports", {
			reporterId: userId,
			reportedUserId: args.reportedUserId,
			reason: args.reason,
			description: args.description,
			status: "pending",
		});

		return reportId;
	},
});

/**
 * Mute a user (hide their content from your feed)
 */
export const muteUser = mutation({
	args: {
		mutedUserId: v.id("users"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in to mute users");

		// Can't mute yourself
		if (userId === args.mutedUserId) {
			throw new Error("You cannot mute yourself");
		}

		// Check if already muted
		const existingMute = await ctx.db
			.query("mutedUsers")
			.withIndex("by_user_and_muted", (q) =>
				q.eq("userId", userId).eq("mutedUserId", args.mutedUserId),
			)
			.unique();

		if (existingMute) {
			throw new Error("User is already muted");
		}

		// Verify user exists
		const mutedUser = await ctx.db.get(args.mutedUserId);
		if (!mutedUser) throw new Error("User not found");

		await ctx.db.insert("mutedUsers", {
			userId,
			mutedUserId: args.mutedUserId,
		});

		return null;
	},
});

/**
 * Unmute a user
 */
export const unmuteUser = mutation({
	args: {
		mutedUserId: v.id("users"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		const existingMute = await ctx.db
			.query("mutedUsers")
			.withIndex("by_user_and_muted", (q) =>
				q.eq("userId", userId).eq("mutedUserId", args.mutedUserId),
			)
			.unique();

		if (!existingMute) {
			throw new Error("User is not muted");
		}

		await ctx.db.delete(existingMute._id);
		return null;
	},
});

/**
 * Get list of muted users
 */
export const getMutedUsers = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("mutedUsers"),
			mutedUserId: v.id("users"),
			mutedUser: v.union(
				v.object({
					_id: v.id("users"),
					name: v.optional(v.string()),
					email: v.optional(v.string()),
				}),
				v.null(),
			),
			_creationTime: v.number(),
		}),
	),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		const mutedUsers = await ctx.db
			.query("mutedUsers")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		const results = await Promise.all(
			mutedUsers.map(async (mute) => {
				const mutedUser = await ctx.db.get(mute.mutedUserId);
				return {
					_id: mute._id,
					mutedUserId: mute.mutedUserId,
					mutedUser: mutedUser
						? {
								_id: mutedUser._id,
								name: mutedUser.name,
								email: mutedUser.email,
							}
						: null,
					_creationTime: mute._creationTime,
				};
			}),
		);

		return results;
	},
});

/**
 * Check if a user is muted
 */
export const isUserMuted = query({
	args: {
		userId: v.id("users"),
	},
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const currentUserId = await getAuthUserId(ctx);
		if (!currentUserId) return false;

		const mute = await ctx.db
			.query("mutedUsers")
			.withIndex("by_user_and_muted", (q) =>
				q.eq("userId", currentUserId).eq("mutedUserId", args.userId),
			)
			.unique();

		return mute !== null;
	},
});

/**
 * Get all user reports (moderator/admin only)
 */
export const getUserReports = query({
	args: {
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("reviewed"),
				v.literal("resolved"),
				v.literal("dismissed"),
			),
		),
		limit: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("userReports"),
			reporterId: v.id("users"),
			reportedUserId: v.id("users"),
			reason: v.union(
				v.literal("spam"),
				v.literal("harassment"),
				v.literal("inappropriate_content"),
				v.literal("impersonation"),
				v.literal("other"),
			),
			description: v.optional(v.string()),
			status: v.union(
				v.literal("pending"),
				v.literal("reviewed"),
				v.literal("resolved"),
				v.literal("dismissed"),
			),
			moderatorId: v.optional(v.id("users")),
			moderatorNotes: v.optional(v.string()),
			actionTaken: v.optional(
				v.union(
					v.literal("none"),
					v.literal("warning"),
					v.literal("user_muted"),
					v.literal("user_suspended"),
				),
			),
			_creationTime: v.number(),
			reporter: v.union(
				v.object({
					_id: v.id("users"),
					name: v.optional(v.string()),
					email: v.optional(v.string()),
				}),
				v.null(),
			),
			reportedUser: v.union(
				v.object({
					_id: v.id("users"),
					name: v.optional(v.string()),
					email: v.optional(v.string()),
				}),
				v.null(),
			),
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
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Check if user is moderator or admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		const role = userRole?.role || "user";
		if (role !== "moderator" && role !== "admin") {
			throw new Error("Only moderators and admins can view user reports");
		}

		const limit = args.limit || 50;

		let reports: Array<Doc<"userReports">>;

		if (args.status) {
			const status: "pending" | "reviewed" | "resolved" | "dismissed" =
				args.status;
			reports = await ctx.db
				.query("userReports")
				.withIndex("by_status", (q) => q.eq("status", status))
				.order("desc")
				.take(limit);
		} else {
			reports = await ctx.db.query("userReports").order("desc").take(limit);
		}

		// Get additional data for each report
		const reportsWithDetails = await Promise.all(
			reports.map(async (report) => {
				const [reporter, reportedUser, moderator] = await Promise.all([
					ctx.db.get(report.reporterId),
					ctx.db.get(report.reportedUserId),
					report.moderatorId ? ctx.db.get(report.moderatorId) : null,
				]);

				return {
					_id: report._id,
					reporterId: report.reporterId,
					reportedUserId: report.reportedUserId,
					reason: report.reason,
					description: report.description,
					status: report.status,
					moderatorId: report.moderatorId,
					moderatorNotes: report.moderatorNotes,
					actionTaken: report.actionTaken,
					_creationTime: report._creationTime,
					reporter: reporter
						? {
								_id: reporter._id,
								name: reporter.name,
								email: reporter.email,
							}
						: null,
					reportedUser: reportedUser
						? {
								_id: reportedUser._id,
								name: reportedUser.name,
								email: reportedUser.email,
							}
						: null,
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

		return reportsWithDetails;
	},
});

/**
 * Update user report status (moderator/admin only)
 */
export const updateUserReportStatus = mutation({
	args: {
		reportId: v.id("userReports"),
		status: v.union(
			v.literal("pending"),
			v.literal("reviewed"),
			v.literal("resolved"),
			v.literal("dismissed"),
		),
		moderatorNotes: v.optional(v.string()),
		actionTaken: v.optional(
			v.union(
				v.literal("none"),
				v.literal("warning"),
				v.literal("user_muted"),
				v.literal("user_suspended"),
			),
		),
	},
	returns: v.id("userReports"),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Check if user is moderator or admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		const role = userRole?.role || "user";
		if (role !== "moderator" && role !== "admin") {
			throw new Error("Only moderators and admins can update user reports");
		}

		const report = await ctx.db.get(args.reportId);
		if (!report) throw new Error("Report not found");

		await ctx.db.patch(args.reportId, {
			status: args.status,
			moderatorId: userId,
			moderatorNotes: args.moderatorNotes,
			actionTaken: args.actionTaken,
		});

		return args.reportId;
	},
});

/**
 * Get reported users list for moderation (moderator/admin only)
 */
export const getReportedUsers = query({
	args: {},
	returns: v.array(
		v.object({
			userId: v.id("users"),
			user: v.union(
				v.object({
					_id: v.id("users"),
					name: v.optional(v.string()),
					email: v.optional(v.string()),
					_creationTime: v.number(),
				}),
				v.null(),
			),
			reportCount: v.number(),
			pendingReports: v.number(),
		}),
	),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in");

		// Check if user is moderator or admin
		const userRole = await ctx.db
			.query("userRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		const role = userRole?.role || "user";
		if (role !== "moderator" && role !== "admin") {
			throw new Error("Only moderators and admins can view reported users");
		}

		// Get all user reports
		const allReports = await ctx.db.query("userReports").collect();

		// Group by reported user
		const userReportMap = new Map<string, { total: number; pending: number }>();

		for (const report of allReports) {
			const userId = report.reportedUserId;
			const current = userReportMap.get(userId) || { total: 0, pending: 0 };
			current.total++;
			if (report.status === "pending") {
				current.pending++;
			}
			userReportMap.set(userId, current);
		}

		// Build result array
		const results = await Promise.all(
			Array.from(userReportMap.entries()).map(
				async ([userIdStr, counts]): Promise<{
					userId: Id<"users">;
					user: {
						_id: Id<"users">;
						name?: string;
						email?: string;
						_creationTime: number;
					} | null;
					reportCount: number;
					pendingReports: number;
				}> => {
					const userId = userIdStr as Id<"users">;
					const user = await ctx.db.get(userId);

					if (!user) {
						return {
							userId: userId,
							user: null,
							reportCount: counts.total,
							pendingReports: counts.pending,
						};
					}

					return {
						userId: userId,
						user: {
							_id: user._id,
							name: user.name,
							email: user.email,
							_creationTime: user._creationTime,
						},
						reportCount: counts.total,
						pendingReports: counts.pending,
					};
				},
			),
		);

		// Sort by pending reports (descending), then total reports
		results.sort((a, b) => {
			if (b.pendingReports !== a.pendingReports) {
				return b.pendingReports - a.pendingReports;
			}
			return b.reportCount - a.reportCount;
		});

		return results;
	},
});
