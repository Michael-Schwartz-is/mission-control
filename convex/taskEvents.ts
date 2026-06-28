import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByTask = query({
  args: {
    projectId: v.string(),
    taskId: v.string(),
  },
  handler: async (ctx, { projectId, taskId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const events = await ctx.db
      .query("taskEvents")
      .withIndex("by_task", (q) =>
        q.eq("userId", userId).eq("projectId", projectId).eq("taskId", taskId)
      )
      .collect();
    return events.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const listByProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const events = await ctx.db
      .query("taskEvents")
      .withIndex("by_project", (q) => q.eq("userId", userId).eq("projectId", projectId))
      .collect();
    return events.sort((a, b) => b._creationTime - a._creationTime);
  },
});
