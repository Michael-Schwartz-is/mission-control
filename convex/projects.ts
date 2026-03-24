import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    // Fetch tasks for each project
    const result = await Promise.all(
      projects.sort((a, b) => a.sortOrder - b.sortOrder).map(async (p) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_user_and_project", (q) =>
            q.eq("userId", userId).eq("projectId", p.projectId)
          )
          .collect();
        return {
          id: p.projectId,
          name: p.name,
          description: p.description,
          repo: p.repo,
          stack: p.stack,
          context: p.context,
          status: p.status,
          tasks: tasks
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((t) => ({
              id: t.taskId,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              createdAt: t.createdAt,
            })),
        };
      })
    );
    return result;
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const sortOrder = existing.length;
    await ctx.db.insert("projects", {
      userId,
      projectId: id,
      name,
      description: "",
      repo: "",
      stack: "",
      context: "",
      status: "New",
      sortOrder,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    projectId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      repo: v.optional(v.string()),
      stack: v.optional(v.string()),
      context: v.optional(v.string()),
      status: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { projectId, updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db
      .query("projects")
      .withIndex("by_user_and_project", (q) =>
        q.eq("userId", userId).eq("projectId", projectId)
      )
      .unique();
    if (!project) throw new Error("Project not found");
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) filtered[k] = v;
    }
    await ctx.db.patch(project._id, filtered);
  },
});

export const remove = mutation({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db
      .query("projects")
      .withIndex("by_user_and_project", (q) =>
        q.eq("userId", userId).eq("projectId", projectId)
      )
      .unique();
    if (!project) return;
    // Delete tasks first
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_project", (q) =>
        q.eq("userId", userId).eq("projectId", projectId)
      )
      .collect();
    for (const t of tasks) {
      await ctx.db.delete(t._id);
    }
    await ctx.db.delete(project._id);
  },
});
