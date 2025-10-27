import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const reportMeme = mutation({
	args: {
		memeId: v.id("memes"),
		reason: v.union(
			v.literal("spam"),
			v.literal("inappropriate"),
			v.literal("harassment"),
			v.literal("copyright"),
			v.literal("misinformation"),
			v.literal("other"),
		),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Must be logged in to report content");

		// Check if user already reported this meme
		const existingReport = await ctx.db
			.query("reports")
			.withIndex("by_meme", (q) => q.eq("memeId", args.memeId))
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
					"You have already reported this content. The report was reviewed and resolved by our moderation team",
				);
			}
			if (existingReport.status === "dismissed") {
				throw new Error(
					"You have already reported this content. The report was reviewed and dismissed by our moderation team",
				);
			}
			// Fallback for any other status
			throw new Error("You have already reported this content");
		}

		// Verify meme exists
		const meme = await ctx.db.get(args.memeId);
		if (!meme) throw new Error("Meme not found");

		const reportId = await ctx.db.insert("reports", {
			reporterId: userId,
			memeId: args.memeId,
			reason: args.reason,
			description: args.description,
			status: "pending",
		});

		return reportId;
	},
});

export const getReports = query({
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
			throw new Error("Only moderators and admins can view reports");
		}

		const limit = args.limit || 50;

		let reports: Doc<"reports">[];

		if (args.status) {
			const status: "pending" | "reviewed" | "resolved" | "dismissed" =
				args.status;
			reports = await ctx.db
				.query("reports")
				.withIndex("by_status", (q) => q.eq("status", status))
				.order("desc")
				.take(limit);
		} else {
			reports = await ctx.db.query("reports").order("desc").take(limit);
		}

		// Get additional data for each report
		const reportsWithDetails = await Promise.all(
			reports.map(async (report) => {
				const [meme, reporter, moderator] = await Promise.all([
					ctx.db.get(report.memeId),
					ctx.db.get(report.reporterId),
					report.moderatorId ? ctx.db.get(report.moderatorId) : null,
				]);

				return {
					...report,
					meme,
					reporter,
					moderator,
				};
			}),
		);

		return reportsWithDetails;
	},
});

export const updateReportStatus = mutation({
	args: {
		reportId: v.id("reports"),
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
				v.literal("content_removed"),
				v.literal("user_suspended"),
			),
		),
	},
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
			throw new Error("Only moderators and admins can update reports");
		}

		const report = await ctx.db.get(args.reportId);
		if (!report) throw new Error("Report not found");

		await ctx.db.patch(args.reportId, {
			status: args.status,
			moderatorId: userId,
			moderatorNotes: args.moderatorNotes,
			actionTaken: args.actionTaken,
		});

		// If action is to remove content, delete the meme
		if (args.actionTaken === "content_removed") {
			await ctx.db.delete(report.memeId);
		}

		return args.reportId;
	},
});

export const getUserReports = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		const reports = await ctx.db
			.query("reports")
			.withIndex("by_reporter", (q) => q.eq("reporterId", userId))
			.order("desc")
			.collect();

		// Get meme details for each report
		const reportsWithMemes = await Promise.all(
			reports.map(async (report) => {
				const meme = await ctx.db.get(report.memeId);
				return {
					...report,
					meme,
				};
			}),
		);

		return reportsWithMemes;
	},
});
