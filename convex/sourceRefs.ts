import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { actorFromUser } from "./provenance";

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const artifact = await ctx.db.get(args.artifactId);
    if (!artifact || artifact.userId !== userId) throw new Error("Source artifact not found");
    const actor = await actorFromUser(ctx, userId);
    const sourceRefId = await ctx.db.insert("sourceRefs", {
      userId,
      artifactId: args.artifactId,
      targetType: args.targetType,
      targetId: args.targetId,
      label: args.label,
      quote: args.quote,
      path: args.path,
      lineStart: args.lineStart,
      lineEnd: args.lineEnd,
      timestampStart: args.timestampStart,
      timestampEnd: args.timestampEnd,
      confidence: args.confidence,
      createdByUserId: actor.userId,
      createdByName: actor.name,
      createdByEmail: actor.email,
      createdVia: actor.via,
      createdAt: new Date().toISOString(),
    });
    if (args.targetType === "task") {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const task = tasks.find((row) => row.taskId === args.targetId);
      if (task) {
        await ctx.db.patch(task._id, {
          sourceRefIds: [...(task.sourceRefIds ?? []), sourceRefId],
          updatedAt: new Date().toISOString(),
        });
      }
    }
    return sourceRefId;
  },
});

export const listForTarget = query({
  args: {
    targetType: v.string(),
    targetId: v.string(),
  },
  handler: async (ctx, { targetType, targetId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const refs = await ctx.db
      .query("sourceRefs")
      .withIndex("by_target", (q) =>
        q.eq("userId", userId).eq("targetType", targetType).eq("targetId", targetId)
      )
      .collect();
    return await Promise.all(
      refs.map(async (ref) => {
        const artifact = await ctx.db.get(ref.artifactId);
        return { ...ref, artifact };
      })
    );
  },
});
