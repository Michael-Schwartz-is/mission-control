import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    projectId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .collect();
    const taskId = crypto.randomUUID();
    await ctx.db.insert("tasks", {
      userId,
      projectId: args.projectId,
      taskId,
      title: args.title,
      description: args.description ?? "",
      status: args.status ?? "backlog",
      priority: args.priority ?? "medium",
      sortOrder: existing.length,
      createdAt: new Date().toISOString(),
    });
    return taskId;
  },
});

export const update = mutation({
  args: {
    projectId: v.string(),
    taskId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(v.string()),
      priority: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { projectId, taskId, updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_project", (q) =>
        q.eq("userId", userId).eq("projectId", projectId)
      )
      .collect();
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) throw new Error("Task not found");
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) filtered[k] = v;
    }
    await ctx.db.patch(task._id, filtered);
  },
});

export const remove = mutation({
  args: { projectId: v.string(), taskId: v.string() },
  handler: async (ctx, { projectId, taskId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_project", (q) =>
        q.eq("userId", userId).eq("projectId", projectId)
      )
      .collect();
    const task = tasks.find((t) => t.taskId === taskId);
    if (task) await ctx.db.delete(task._id);
  },
});

export const move = mutation({
  args: {
    projectId: v.string(),
    taskId: v.string(),
    newStatus: v.string(),
  },
  handler: async (ctx, { projectId, taskId, newStatus }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_project", (q) =>
        q.eq("userId", userId).eq("projectId", projectId)
      )
      .collect();
    const task = tasks.find((t) => t.taskId === taskId);
    if (task) await ctx.db.patch(task._id, { status: newStatus });
  },
});
