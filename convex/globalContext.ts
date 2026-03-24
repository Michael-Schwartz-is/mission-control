import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return {};
    const row = await ctx.db
      .query("globalContext")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return row ? JSON.parse(row.data) : {};
  },
});

export const set = mutation({
  args: { data: v.string() },
  handler: async (ctx, { data }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("globalContext")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { data });
    } else {
      await ctx.db.insert("globalContext", { userId, data });
    }
  },
});
