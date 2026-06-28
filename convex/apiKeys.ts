import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return keys.map((k) => ({
      id: k._id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      createdAt: k._creationTime,
    }));
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const rawKey = `mc_${crypto.randomUUID().replace(/-/g, "")}`;
    const keyHash = await hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 10);
    const id = await ctx.db.insert("apiKeys", {
      userId,
      name,
      keyHash,
      keyPrefix,
    });
    return { id, name, key: rawKey, keyPrefix };
  },
});

export const remove = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const key = await ctx.db.get(id);
    if (key && key.userId === userId) {
      await ctx.db.delete(id);
    }
  },
});

// Internal: resolve user by API key hash (for HTTP actions)
export const resolveByHash = internalQuery({
  args: { keyHash: v.string() },
  handler: async (ctx, { keyHash }) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_hash", (q) => q.eq("keyHash", keyHash))
      .unique();
    if (!key) return null;
    return {
      userId: key.userId,
      keyName: key.name,
      keyPrefix: key.keyPrefix,
    };
  },
});
