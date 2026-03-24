import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export function AdminPage() {
  const stats = useQuery(api.admin.stats)

  if (stats === undefined) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
  }

  if (stats === null) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Not authorized</div>
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <h1 className="text-xl font-semibold text-foreground">Analytics</h1>

        {/* Overview */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Users" value={stats.totalUsers} />
          <StatCard label="Projects" value={stats.totalProjects} />
          <StatCard label="Total tasks" value={stats.totalTasks} />
          <StatCard label="Open tasks" value={stats.openTasks} />
        </div>

        {/* Status distribution */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Task status distribution</h2>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex gap-3 flex-wrap">
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <span className="text-foreground font-medium">{count}</span>
                  <span className="text-muted-foreground">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Users</h2>
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">User</th>
                  <th className="text-right px-4 py-2.5 font-medium">Projects</th>
                  <th className="text-right px-4 py-2.5 font-medium">Tasks</th>
                  <th className="text-right px-4 py-2.5 font-medium">Open</th>
                  <th className="text-right px-4 py-2.5 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {stats.users.map((u, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {u.image ? (
                          <img src={u.image} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-foreground">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <div className="text-foreground font-medium">{u.name}</div>
                          <div className="text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-4 py-2.5 text-foreground">{u.projectCount}</td>
                    <td className="text-right px-4 py-2.5 text-foreground">{u.taskCount}</td>
                    <td className="text-right px-4 py-2.5 text-foreground">{u.openTaskCount}</td>
                    <td className="text-right px-4 py-2.5 text-muted-foreground">
                      {new Date(u.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
