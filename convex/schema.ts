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
    createdByUserId: v.optional(v.id("users")),
    createdByName: v.optional(v.string()),
    createdByEmail: v.optional(v.string()),
    createdVia: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    sourceRefIds: v.optional(v.array(v.id("sourceRefs"))),
  })
    .index("by_user_and_project", ["userId", "projectId"])
    .index("by_user", ["userId"]),

  sourceArtifacts: defineTable({
    userId: v.id("users"),
    title: v.string(),
    type: v.string(),
    storageId: v.optional(v.id("_storage")),
    mimeType: v.optional(v.string()),
    filename: v.optional(v.string()),
    url: v.optional(v.string()),
    textPreview: v.optional(v.string()),
    checksum: v.optional(v.string()),
    createdByUserId: v.optional(v.id("users")),
    createdByName: v.optional(v.string()),
    createdByEmail: v.optional(v.string()),
    createdVia: v.string(),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"]),

  sourceRefs: defineTable({
    userId: v.id("users"),
    artifactId: v.id("sourceArtifacts"),
    targetType: v.string(),
    targetId: v.string(),
    label: v.string(),
    quote: v.optional(v.string()),
    path: v.optional(v.string()),
    lineStart: v.optional(v.number()),
    lineEnd: v.optional(v.number()),
    timestampStart: v.optional(v.number()),
    timestampEnd: v.optional(v.number()),
    confidence: v.optional(v.number()),
    createdByUserId: v.optional(v.id("users")),
    createdByName: v.optional(v.string()),
    createdByEmail: v.optional(v.string()),
    createdVia: v.string(),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_target", ["userId", "targetType", "targetId"])
    .index("by_artifact", ["artifactId"]),

  taskEvents: defineTable({
    userId: v.id("users"),
    projectId: v.string(),
    taskId: v.string(),
    type: v.string(),
    summary: v.string(),
    before: v.optional(v.string()),
    after: v.optional(v.string()),
    actorUserId: v.optional(v.id("users")),
    actorName: v.optional(v.string()),
    actorEmail: v.optional(v.string()),
    createdVia: v.string(),
    createdAt: v.string(),
    sourceRefId: v.optional(v.id("sourceRefs")),
    operationId: v.optional(v.id("operations")),
  })
    .index("by_user", ["userId"])
    .index("by_task", ["userId", "projectId", "taskId"])
    .index("by_project", ["userId", "projectId"]),

  operations: defineTable({
    userId: v.id("users"),
    type: v.string(),
    summary: v.string(),
    actorUserId: v.optional(v.id("users")),
    actorName: v.optional(v.string()),
    actorEmail: v.optional(v.string()),
    createdVia: v.string(),
    createdAt: v.string(),
    sourceArtifactId: v.optional(v.id("sourceArtifacts")),
    projectsTouched: v.optional(v.number()),
    tasksCreated: v.optional(v.number()),
    tasksUpdated: v.optional(v.number()),
    tasksDeleted: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"]),

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
