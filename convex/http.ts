import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Auth routes (OAuth callbacks)
auth.addHttpRoutes(http);

// --- Agent API (API key auth via HTTP actions) ---

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function resolveApiKeyUser(
  ctx: any,
  req: Request
): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer mc_")) return null;
  const rawKey = authHeader.slice(7);
  const keyHash = await hashKey(rawKey);
  const userId = await ctx.runQuery(
    internal.apiKeys.resolveByHash,
    { keyHash }
  );
  return userId;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// OPTIONS preflight
http.route({
  path: "/api/data",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }),
});

// GET /api/data — bulk fetch
http.route({
  path: "/api/data",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const userId = await resolveApiKeyUser(ctx, req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }
    const data = await ctx.runQuery(internal.data.getAll, { userId });
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }),
});

// PUT /api/data — bulk import
http.route({
  path: "/api/data",
  method: "PUT",
  handler: httpAction(async (ctx, req) => {
    const userId = await resolveApiKeyUser(ctx, req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }
    const body = await req.json();
    await ctx.runMutation(internal.data.importAll, { userId, data: body });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }),
});

export default http;
