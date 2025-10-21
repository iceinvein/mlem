import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const limit = args.limit || 20;
    const sortBy = args.sortBy || "newest";
    
    let memes;
    
    if (args.categoryId) {
      memes = await ctx.db
        .query("memes")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .order("desc")
        .take(limit);
    } else if (sortBy === "popular") {
      memes = await ctx.db
        .query("memes")
        .withIndex("by_likes")
        .order("desc")
        .take(limit);
    } else {
      memes = await ctx.db
        .query("memes")
        .order("desc")
        .take(limit);
    }
    
    // Sort by popularity if needed and category filter is applied
    if (args.categoryId && sortBy === "popular") {
      memes = memes.sort((a, b) => b.likes - a.likes);
    }
    
    // Get user interactions if logged in
    const memesWithInteractions = await Promise.all(
      memes.map(async (meme) => {
        const category = await ctx.db.get(meme.categoryId);
        let userLiked = false;
        let userShared = false;
        
        if (userId) {
          const interactions = await ctx.db
            .query("userInteractions")
            .withIndex("by_user_and_meme", (q) => 
              q.eq("userId", userId).eq("memeId", meme._id)
            )
            .collect();
          
          userLiked = interactions.some(i => i.type === "like");
          userShared = interactions.some(i => i.type === "share");
        }
        
        // Get image URL from storage if it's a storage ID
        let imageUrl = meme.imageUrl;
        if (meme.imageUrl && !meme.imageUrl.startsWith('http')) {
          const storageUrl = await ctx.storage.getUrl(meme.imageUrl as any);
          if (storageUrl) {
            imageUrl = storageUrl;
          }
        }
        
        return {
          ...meme,
          imageUrl,
          category,
          userLiked,
          userShared,
        };
      })
    );
    
    return memesWithInteractions;
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
        q.eq("userId", userId).eq("memeId", args.memeId)
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
        q.eq("userId", userId).eq("memeId", args.memeId)
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

// Seed data function
export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if categories already exist
    const existingCategories = await ctx.db.query("categories").collect();
    if (existingCategories.length > 0) return;
    
    // Create categories
    const categories = [
      { name: "Funny", icon: "😂", color: "#FFD700", description: "Hilarious memes that will make you laugh" },
      { name: "Animals", icon: "🐱", color: "#FF6B6B", description: "Cute and funny animal memes" },
      { name: "Gaming", icon: "🎮", color: "#4ECDC4", description: "Gaming memes and jokes" },
      { name: "Tech", icon: "💻", color: "#45B7D1", description: "Technology and programming humor" },
      { name: "Sports", icon: "⚽", color: "#96CEB4", description: "Sports memes and highlights" },
      { name: "Movies", icon: "🎬", color: "#FFEAA7", description: "Movie and TV show memes" },
    ];
    
    const categoryIds = [];
    for (const category of categories) {
      const id = await ctx.db.insert("categories", category);
      categoryIds.push(id);
    }
    
    // Create sample memes
    const sampleMemes = [
      {
        title: "When you finally understand recursion",
        imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=400&fit=crop",
        categoryId: categoryIds[3], // Tech
        likes: 42,
        shares: 12,
        comments: 8,
        tags: ["programming", "recursion", "coding"],
      },
      {
        title: "Cat discovers the internet",
        imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop",
        categoryId: categoryIds[1], // Animals
        likes: 156,
        shares: 34,
        comments: 23,
        tags: ["cat", "internet", "funny"],
      },
      {
        title: "When the game loads but your skills don't",
        imageUrl: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=400&fit=crop",
        categoryId: categoryIds[2], // Gaming
        likes: 89,
        shares: 23,
        comments: 15,
        tags: ["gaming", "skills", "loading"],
      },
      {
        title: "Monday morning motivation",
        imageUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34d19?w=400&h=400&fit=crop",
        categoryId: categoryIds[0], // Funny
        likes: 203,
        shares: 67,
        comments: 31,
        tags: ["monday", "motivation", "coffee"],
      },
      {
        title: "When your favorite team scores",
        imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop",
        categoryId: categoryIds[4], // Sports
        likes: 78,
        shares: 19,
        comments: 12,
        tags: ["sports", "celebration", "goal"],
      },
      {
        title: "Plot twist nobody saw coming",
        imageUrl: "https://images.unsplash.com/photo-1489599328109-2d0d3b5d0f99?w=400&h=400&fit=crop",
        categoryId: categoryIds[5], // Movies
        likes: 134,
        shares: 45,
        comments: 27,
        tags: ["movies", "plot twist", "surprise"],
      },
    ];
    
    for (const meme of sampleMemes) {
      await ctx.db.insert("memes", meme);
    }
  },
});

export const createMeme = mutation({
  args: {
    title: v.string(),
    imageUrl: v.string(),
    categoryId: v.id("categories"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

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
