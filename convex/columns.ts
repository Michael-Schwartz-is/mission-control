import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULT_COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "Todo" },
  { id: "in_progress", label: "In Progress" },
  { id: "blocked", label: "Blocked" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
];

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return DEFAULT_COLUMNS;
    const cols = await ctx.db
      .query("columns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (cols.length === 0) return DEFAULT_COLUMNS;
    return cols
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ id: c.columnId, label: c.label }));
  },
});

export const add = mutation({
  args: { label: v.string() },
  handler: async (ctx, { label }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("columns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const columnId = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    await ctx.db.insert("columns", {
      userId,
      columnId,
      label,
      sortOrder: existing.length,
    });
  },
});
