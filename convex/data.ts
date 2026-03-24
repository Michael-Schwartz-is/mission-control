import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Bulk data endpoints for agent API (userId passed explicitly from HTTP action)

export const getAll = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const uid = userId as any; // Trust the HTTP action layer

    // Global context
    const globalRow = await ctx.db
      .query("globalContext")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .unique();
    const global = globalRow ? JSON.parse(globalRow.data) : {};

    // Columns
    const colRows = await ctx.db
      .query("columns")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();
    const defaultCols = [
      { id: "backlog", label: "Backlog" },
      { id: "todo", label: "Todo" },
      { id: "in_progress", label: "In Progress" },
      { id: "blocked", label: "Blocked" },
      { id: "in_review", label: "In Review" },
      { id: "done", label: "Done" },
    ];
    const columns =
      colRows.length > 0
        ? colRows.sort((a, b) => a.sortOrder - b.sortOrder).map((c) => ({ id: c.columnId, label: c.label }))
        : defaultCols;

    // Projects + tasks
    const projectRows = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();
    const taskRows = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();

    const tasksByProject = new Map<string, typeof taskRows>();
    for (const t of taskRows) {
      if (!tasksByProject.has(t.projectId)) tasksByProject.set(t.projectId, []);
      tasksByProject.get(t.projectId)!.push(t);
    }

    const projects = projectRows
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.projectId,
        name: p.name,
        description: p.description,
        repo: p.repo,
        stack: p.stack,
        context: p.context,
        status: p.status,
        tasks: (tasksByProject.get(p.projectId) || [])
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((t) => ({
            id: t.taskId,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            createdAt: t.createdAt,
          })),
      }));

    return { global, columns, projects };
  },
});

export const importAll = mutation({
  args: {
    userId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, { userId, data }) => {
    const uid = userId as any;
    const { global: globalData, columns, projects } = data as any;

    // Clear existing data
    const existingGlobal = await ctx.db
      .query("globalContext")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .unique();
    if (existingGlobal) await ctx.db.delete(existingGlobal._id);

    const existingCols = await ctx.db
      .query("columns")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();
    for (const c of existingCols) await ctx.db.delete(c._id);

    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();
    for (const t of existingTasks) await ctx.db.delete(t._id);

    const existingProjects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();
    for (const p of existingProjects) await ctx.db.delete(p._id);

    // Import global context
    if (globalData) {
      await ctx.db.insert("globalContext", {
        userId: uid,
        data: JSON.stringify(globalData),
      });
    }

    // Import columns
    if (columns) {
      for (let i = 0; i < columns.length; i++) {
        await ctx.db.insert("columns", {
          userId: uid,
          columnId: columns[i].id,
          label: columns[i].label,
          sortOrder: i,
        });
      }
    }

    // Import projects + tasks
    if (projects) {
      for (let pi = 0; pi < projects.length; pi++) {
        const p = projects[pi];
        await ctx.db.insert("projects", {
          userId: uid,
          projectId: p.id,
          name: p.name,
          description: p.description || "",
          repo: p.repo || "",
          stack: p.stack || "",
          context: p.context || "",
          status: p.status || "New",
          sortOrder: pi,
        });
        if (p.tasks) {
          for (let ti = 0; ti < p.tasks.length; ti++) {
            const t = p.tasks[ti];
            await ctx.db.insert("tasks", {
              userId: uid,
              projectId: p.id,
              taskId: t.id || crypto.randomUUID(),
              title: t.title,
              description: t.description || "",
              status: t.status || "backlog",
              priority: t.priority || "medium",
              sortOrder: ti,
              createdAt: t.createdAt || new Date().toISOString(),
            });
          }
        }
      }
    }
  },
});
