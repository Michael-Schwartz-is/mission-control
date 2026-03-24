import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Admin email — only this user can see analytics
const ADMIN_EMAIL = "micha.gash@gmail.com";

export const stats = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user || user.email !== ADMIN_EMAIL) return null;

    // Count all users
    const allUsers = await ctx.db.query("users").collect();

    // Count all projects and tasks
    const allProjects = await ctx.db.query("projects").collect();
    const allTasks = await ctx.db.query("tasks").collect();

    // Per-user breakdown
    const userStats = await Promise.all(
      allUsers.map(async (u) => {
        const projects = allProjects.filter((p) => p.userId === u._id);
        const tasks = allTasks.filter((t) => t.userId === u._id);
        const openTasks = tasks.filter((t) => t.status !== "done");
        return {
          name: u.name || u.email || "Unknown",
          email: u.email || "",
          image: u.image || null,
          projectCount: projects.length,
          taskCount: tasks.length,
          openTaskCount: openTasks.length,
          joinedAt: u._creationTime,
        };
      })
    );

    // Task status distribution
    const statusCounts: Record<string, number> = {};
    for (const t of allTasks) {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    }

    return {
      totalUsers: allUsers.length,
      totalProjects: allProjects.length,
      totalTasks: allTasks.length,
      openTasks: allTasks.filter((t) => t.status !== "done").length,
      statusCounts,
      users: userStats.sort(
        (a, b) => b.projectCount - a.projectCount
      ),
    };
  },
});
