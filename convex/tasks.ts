import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { actorFromUser, logTaskEvent } from "./provenance";

export const create = mutation({
  args: {
    projectId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    sourceRefIds: v.optional(v.array(v.id("sourceRefs"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const actor = await actorFromUser(ctx, userId);
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .collect();
    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();
    await ctx.db.insert("tasks", {
      userId,
      projectId: args.projectId,
      taskId,
      title: args.title,
      description: args.description ?? "",
      status: args.status ?? "backlog",
      priority: args.priority ?? "medium",
      sortOrder: existing.length,
      createdAt: now,
      createdByUserId: actor.userId,
      createdByName: actor.name,
      createdByEmail: actor.email,
      createdVia: actor.via,
      updatedAt: now,
      completedAt: args.status === "done" ? now : undefined,
      sourceRefIds: args.sourceRefIds,
    });
    await logTaskEvent(ctx, {
      userId,
      projectId: args.projectId,
      taskId,
      type: "taskCreated",
      summary: `Created task "${args.title}"`,
      actor,
      after: {
        title: args.title,
        status: args.status ?? "backlog",
        priority: args.priority ?? "medium",
      },
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
      sourceRefIds: v.optional(v.array(v.id("sourceRefs"))),
    }),
  },
  handler: async (ctx, { projectId, taskId, updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const actor = await actorFromUser(ctx, userId);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_project", (q) =>
        q.eq("userId", userId).eq("projectId", projectId)
      )
      .collect();
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) throw new Error("Task not found");
    const filtered: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) filtered[k] = v;
    }
    if (updates.status === "done" && task.status !== "done") {
      filtered.completedAt = filtered.updatedAt;
    }
    await ctx.db.patch(task._id, filtered);
    const type =
      updates.status !== undefined && updates.status !== task.status
        ? "statusChanged"
        : updates.priority !== undefined && updates.priority !== task.priority
          ? "priorityChanged"
          : "taskUpdated";
    await logTaskEvent(ctx, {
      userId,
      projectId,
      taskId,
      type,
      summary:
        type === "statusChanged"
          ? `Changed status from ${task.status} to ${updates.status}`
          : type === "priorityChanged"
            ? `Changed priority from ${task.priority} to ${updates.priority}`
            : `Updated task "${task.title}"`,
      actor,
      before: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        sourceRefIds: task.sourceRefIds,
      },
      after: updates,
    });
  },
});

export const remove = mutation({
  args: { projectId: v.string(), taskId: v.string() },
  handler: async (ctx, { projectId, taskId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const actor = await actorFromUser(ctx, userId);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_project", (q) =>
        q.eq("userId", userId).eq("projectId", projectId)
      )
      .collect();
    const task = tasks.find((t) => t.taskId === taskId);
    if (task) {
      await logTaskEvent(ctx, {
        userId,
        projectId,
        taskId,
        type: "taskDeleted",
        summary: `Deleted task "${task.title}"`,
        actor,
        before: {
          title: task.title,
          status: task.status,
          priority: task.priority,
        },
      });
      await ctx.db.delete(task._id);
    }
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
    const actor = await actorFromUser(ctx, userId);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_project", (q) =>
        q.eq("userId", userId).eq("projectId", projectId)
      )
      .collect();
    const task = tasks.find((t) => t.taskId === taskId);
    if (task) {
      const now = new Date().toISOString();
      await ctx.db.patch(task._id, {
        status: newStatus,
        updatedAt: now,
        completedAt: newStatus === "done" && task.status !== "done" ? now : task.completedAt,
      });
      await logTaskEvent(ctx, {
        userId,
        projectId,
        taskId,
        type: "statusChanged",
        summary: `Changed status from ${task.status} to ${newStatus}`,
        actor,
        before: { status: task.status },
        after: { status: newStatus },
      });
    }
  },
});
