import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { logTaskEvent } from "./provenance";
import type { Id } from "./_generated/dataModel";

type ImportColumn = { id: string; label: string };
type ImportTask = {
  id?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  checklist?: { id: string; text: string; done: boolean }[];
  createdAt?: string;
  sourceRefIds?: Id<"sourceRefs">[];
};
type ImportProject = {
  id: string;
  name: string;
  description?: string;
  repo?: string;
  stack?: string;
  context?: string;
  status?: string;
  tasks?: ImportTask[];
};
type ImportData = {
  global?: unknown;
  columns?: ImportColumn[];
  projects?: ImportProject[];
};

// Internal only — called by HTTP actions, not directly by clients

export const getAll = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const uid = userId as Id<"users">; // Trust the HTTP action layer

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
            checklist: t.checklist,
            createdAt: t.createdAt,
            createdByName: t.createdByName,
            createdByEmail: t.createdByEmail,
            createdVia: t.createdVia,
            updatedAt: t.updatedAt,
            completedAt: t.completedAt,
            sourceRefIds: t.sourceRefIds,
          })),
      }));

    return { global, columns, projects };
  },
});

export const importAll = internalMutation({
  args: {
    userId: v.string(),
    data: v.any(),
    actorName: v.optional(v.string()),
    actorEmail: v.optional(v.string()),
    createdVia: v.optional(v.string()),
    sourceArtifactId: v.optional(v.id("sourceArtifacts")),
  },
  handler: async (ctx, { userId, data, actorName, actorEmail, createdVia, sourceArtifactId }) => {
    const uid = userId as Id<"users">;
    const { global: globalData, columns, projects } = data as ImportData;
    const now = new Date().toISOString();
    const via = createdVia ?? "api";
    const actor = {
      userId: uid,
      name: actorName ?? "API import",
      email: actorEmail,
      via,
    };

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

    const operationId = await ctx.db.insert("operations", {
      userId: uid,
      type: "bulkImport",
      summary: `Imported ${projects?.length ?? 0} projects from API`,
      actorUserId: uid,
      actorName: actor.name,
      actorEmail: actor.email,
      createdVia: via,
      createdAt: now,
      sourceArtifactId,
      projectsTouched: projects?.length ?? 0,
      tasksCreated: projects?.reduce((total, p) => total + (p.tasks?.length ?? 0), 0) ?? 0,
      tasksDeleted: existingTasks.length,
    });

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
            const importedTaskId = t.id || crypto.randomUUID();
            await ctx.db.insert("tasks", {
              userId: uid,
              projectId: p.id,
              taskId: importedTaskId,
              title: t.title,
              description: t.description || "",
              status: t.status || "backlog",
              priority: t.priority || "medium",
              checklist: t.checklist,
              sortOrder: ti,
              createdAt: t.createdAt || now,
              createdByUserId: uid,
              createdByName: actor.name,
              createdByEmail: actor.email,
              createdVia: via,
              updatedAt: now,
              completedAt: (t.status || "backlog") === "done" ? now : undefined,
              sourceRefIds: t.sourceRefIds,
            });
            await logTaskEvent(ctx, {
              userId: uid,
              projectId: p.id,
              taskId: importedTaskId,
              type: "imported",
              summary: `Imported task "${t.title}"`,
              actor,
              after: {
                title: t.title,
                status: t.status || "backlog",
                priority: t.priority || "medium",
                checklist: t.checklist,
              },
              operationId,
            });
          }
        }
      }
    }
  },
});
