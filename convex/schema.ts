import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Per-user global context (free-form JSON string)
  globalContext: defineTable({
    userId: v.id("users"),
    data: v.string(), // JSON string of GlobalContext
  }).index("by_user", ["userId"]),

  // Per-user kanban columns
  columns: defineTable({
    userId: v.id("users"),
    columnId: v.string(),
    label: v.string(),
    sortOrder: v.number(),
  }).index("by_user", ["userId"]),

  // Projects
  projects: defineTable({
    userId: v.id("users"),
    projectId: v.string(), // kebab-case slug
    name: v.string(),
    description: v.string(),
    repo: v.string(),
    stack: v.string(),
    context: v.string(),
    status: v.string(),
    sortOrder: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_project", ["userId", "projectId"]),

  // Tasks
  tasks: defineTable({
    userId: v.id("users"),
    projectId: v.string(),
    taskId: v.string(), // UUID
    title: v.string(),
    description: v.string(),
    status: v.string(),
    priority: v.string(),
    sortOrder: v.number(),
    createdAt: v.string(),
  })
    .index("by_user_and_project", ["userId", "projectId"])
    .index("by_user", ["userId"]),

  // API keys for agent access
  apiKeys: defineTable({
    userId: v.id("users"),
    name: v.string(),
    keyHash: v.string(),
    keyPrefix: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_hash", ["keyHash"]),
});
