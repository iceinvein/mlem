import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const clearAllCategories = internalMutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		// Get all categories
		const categories = await ctx.db.query("categories").collect();

		// Delete all categories
		for (const category of categories) {
			await ctx.db.delete(category._id);
		}

		console.log(`Deleted ${categories.length} categories`);
		return null;
	},
});

export const clearAllMemes = internalMutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		// Get all memes
		const memes = await ctx.db.query("memes").collect();

		// Delete all memes
		for (const meme of memes) {
			await ctx.db.delete(meme._id);
		}

		console.log(`Deleted ${memes.length} memes`);
		return null;
	},
});

export const resetDatabase = internalMutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		// Clear all memes first (they reference categories)
		const memes = await ctx.db.query("memes").collect();
		for (const meme of memes) {
			await ctx.db.delete(meme._id);
		}

		// Clear all categories
		const categories = await ctx.db.query("categories").collect();
		for (const category of categories) {
			await ctx.db.delete(category._id);
		}

		// Clear all comments
		const comments = await ctx.db.query("comments").collect();
		for (const comment of comments) {
			await ctx.db.delete(comment._id);
		}

		// Clear all user interactions
		const interactions = await ctx.db.query("userInteractions").collect();
		for (const interaction of interactions) {
			await ctx.db.delete(interaction._id);
		}

		// Clear all reports
		const reports = await ctx.db.query("reports").collect();
		for (const report of reports) {
			await ctx.db.delete(report._id);
		}

		// Clear all user preferences
		const preferences = await ctx.db.query("userPreferences").collect();
		for (const preference of preferences) {
			await ctx.db.delete(preference._id);
		}

		console.log("Database reset complete");
		return null;
	},
});
