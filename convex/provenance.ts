import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export type Actor = {
  userId: Id<"users">;
  name?: string;
  email?: string;
  via: string;
};

export async function actorFromUser(ctx: MutationCtx, userId: Id<"users">, via = "web"): Promise<Actor> {
  const user = await ctx.db.get(userId);
  return {
    userId,
    name: user?.name ?? user?.email ?? "Unknown",
    email: user?.email,
    via,
  };
}

export async function logTaskEvent(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    projectId: string;
    taskId: string;
    type: string;
    summary: string;
    actor?: Actor;
    before?: unknown;
    after?: unknown;
    sourceRefId?: Id<"sourceRefs">;
    operationId?: Id<"operations">;
  }
) {
  await ctx.db.insert("taskEvents", {
    userId: args.userId,
    projectId: args.projectId,
    taskId: args.taskId,
    type: args.type,
    summary: args.summary,
    before: args.before === undefined ? undefined : JSON.stringify(args.before),
    after: args.after === undefined ? undefined : JSON.stringify(args.after),
    actorUserId: args.actor?.userId,
    actorName: args.actor?.name,
    actorEmail: args.actor?.email,
    createdVia: args.actor?.via ?? "system",
    createdAt: new Date().toISOString(),
    sourceRefId: args.sourceRefId,
    operationId: args.operationId,
  });
}
