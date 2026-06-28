import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { actorFromUser } from "./provenance";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    storageId: v.optional(v.id("_storage")),
    mimeType: v.optional(v.string()),
    filename: v.optional(v.string()),
    url: v.optional(v.string()),
    textPreview: v.optional(v.string()),
    checksum: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const actor = await actorFromUser(ctx, userId);
    return await ctx.db.insert("sourceArtifacts", {
      userId,
      title: args.title,
      type: args.type,
      storageId: args.storageId,
      mimeType: args.mimeType,
      filename: args.filename,
      url: args.url,
      textPreview: args.textPreview,
      checksum: args.checksum,
      createdByUserId: actor.userId,
      createdByName: actor.name,
      createdByEmail: actor.email,
      createdVia: actor.via,
      createdAt: new Date().toISOString(),
    });
  },
});

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("sourceArtifacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return await Promise.all(
      rows
        .sort((a, b) => b._creationTime - a._creationTime)
        .map(async (row) => ({
          ...row,
          storageUrl: row.storageId ? await ctx.storage.getUrl(row.storageId) : null,
        }))
    );
  },
});
