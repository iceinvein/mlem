import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  categories: defineTable({
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    description: v.string(),
  }),
  
  memes: defineTable({
    title: v.string(),
    imageUrl: v.string(),
    categoryId: v.id("categories"),
    authorId: v.optional(v.id("users")),
    likes: v.number(),
    shares: v.number(),
    comments: v.optional(v.number()),
    tags: v.array(v.string()),
  }).index("by_category", ["categoryId"])
    .index("by_likes", ["likes"]),
  
  comments: defineTable({
    memeId: v.id("memes"),
    authorId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  }).index("by_meme", ["memeId"])
    .index("by_parent", ["parentId"]),
  
  userPreferences: defineTable({
    userId: v.id("users"),
    favoriteCategories: v.array(v.id("categories")),
    feedSettings: v.object({
      sortBy: v.union(v.literal("newest"), v.literal("popular")),
      showOnlyFavorites: v.boolean(),
    }),
  }).index("by_user", ["userId"]),
  
  userInteractions: defineTable({
    userId: v.id("users"),
    memeId: v.id("memes"),
    type: v.union(v.literal("like"), v.literal("share")),
  }).index("by_user_and_meme", ["userId", "memeId"])
    .index("by_meme", ["memeId"]),
  
  reports: defineTable({
    reporterId: v.id("users"),
    memeId: v.id("memes"),
    reason: v.union(
      v.literal("spam"),
      v.literal("inappropriate"),
      v.literal("harassment"),
      v.literal("copyright"),
      v.literal("misinformation"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    moderatorId: v.optional(v.id("users")),
    moderatorNotes: v.optional(v.string()),
    actionTaken: v.optional(v.union(
      v.literal("none"),
      v.literal("warning"),
      v.literal("content_removed"),
      v.literal("user_suspended")
    )),
  }).index("by_meme", ["memeId"])
    .index("by_status", ["status"])
    .index("by_reporter", ["reporterId"]),

  userRoles: defineTable({
    userId: v.id("users"),
    role: v.union(
      v.literal("user"),
      v.literal("moderator"),
      v.literal("admin")
    ),
    assignedBy: v.optional(v.id("users")),
    assignedAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_role", ["role"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
