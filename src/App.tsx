import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/auth";
import { LoginPage } from "@/components/LoginPage";
import { Sidebar } from "@/components/Sidebar";
import { ProjectContext } from "@/components/ProjectContext";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SettingsPage } from "@/components/SettingsPage";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { Project } from "@/types";

function readPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(`mc:${key}`);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function writePref(key: string, value: unknown) {
  localStorage.setItem(`mc:${key}`, JSON.stringify(value));
}

function Dashboard() {
  const { signOut } = useAuth();

  // Current user from Google OAuth
  const currentUser = useQuery(api.users.currentUser);

  // Reactive queries
  const projects = useQuery(api.projects.list) ?? [];
  const columns = useQuery(api.columns.list) ?? [];
  const globalContext = useQuery(api.globalContext.get) ?? {};

  // Mutations
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const moveTask = useMutation(api.tasks.move);
  const addColumn = useMutation(api.columns.add);
  const setGlobalContext = useMutation(api.globalContext.set);

  const [selectedId, setSelectedId] = useState<string | null>(() =>
    readPref("selectedId", null)
  );
  const [showContext, setShowContext] = useState(() =>
    readPref("showContext", true)
  );
  const [showBoard, setShowBoard] = useState(() =>
    readPref("showBoard", true)
  );
  const [showSidebar, setShowSidebar] = useState(() =>
    readPref("showSidebar", true)
  );
  const [newTaskTrigger, setNewTaskTrigger] = useState(0);
  const [newProjectTrigger, setNewProjectTrigger] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [rtl, setRtl] = useState(() => readPref("rtl", false));

  const effectiveSelectedId =
    selectedId && projects.some((p) => p.id === selectedId)
      ? selectedId
      : projects[0]?.id ?? null;

  const handleSelectProject = useCallback((id: string) => {
    setSelectedId(id);
    writePref("selectedId", id);
  }, []);

  const toggleContext = useCallback(() => {
    setShowContext((v) => {
      writePref("showContext", !v);
      return !v;
    });
  }, []);

  const toggleBoard = useCallback(() => {
    setShowBoard((v) => {
      writePref("showBoard", !v);
      return !v;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setShowSidebar((v) => {
      writePref("showSidebar", !v);
      return !v;
    });
  }, []);

  const triggerNewTask = useCallback(() => {
    setShowBoard(true);
    writePref("showBoard", true);
    setNewTaskTrigger((n) => n + 1);
  }, []);

  useKeyboardShortcuts({
    n: triggerNewTask,
    p: () => setNewProjectTrigger((n) => n + 1),
    b: toggleBoard,
    d: toggleContext,
    s: toggleSidebar,
    ",": () => setShowSettings((v) => !v),
  });

  const userName = currentUser?.name || "User";
  const userImage = currentUser?.image;
  const selected = projects.find((p) => p.id === effectiveSelectedId) ?? null;

  return (
    <div className="flex h-screen relative" dir={rtl ? "rtl" : "ltr"}>
      <div
        className={`shrink-0 transition-all duration-200 ease-in-out overflow-hidden ${showSidebar ? "w-48" : "w-0"}`}
      >
        <Sidebar
          projects={projects as Project[]}
          global={globalContext}
          selectedId={effectiveSelectedId}
          onSelect={(id) => {
            setShowSettings(false);
            handleSelectProject(id);
          }}
          onAddProject={async (name) => {
            const id = await createProject({ name });
            setShowSettings(false);
            handleSelectProject(id);
          }}
          onDeleteProject={async (id) => {
            await removeProject({ projectId: id });
            if (effectiveSelectedId === id) {
              const remaining = projects.filter((p) => p.id !== id);
              handleSelectProject(remaining[0]?.id ?? "");
            }
          }}
          userName={userName}
          userImage={userImage}
          onSettingsClick={() => setShowSettings(true)}
          onLogout={() => void signOut()}
          newProjectTrigger={newProjectTrigger}
        />
      </div>
      <button
        onClick={toggleSidebar}
        className={`absolute top-1/2 -translate-y-1/2 z-10 w-4 h-8 bg-border hover:bg-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 ${rtl ? "rounded-l-md" : "rounded-r-md"}`}
        style={
          rtl
            ? { right: showSidebar ? "192px" : "0px" }
            : { left: showSidebar ? "192px" : "0px" }
        }
      >
        <span className="text-[10px]">
          {rtl
            ? showSidebar ? "▸" : "◂"
            : showSidebar ? "◂" : "▸"}
        </span>
      </button>
      <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-background">
        {showSettings ? (
          <SettingsPage
            globalContext={globalContext}
            onGlobalChange={(data) =>
              setGlobalContext({ data: JSON.stringify(data) })
            }
            rtl={rtl}
            onRtlChange={(v) => { setRtl(v); writePref("rtl", v) }}
            onClose={() => setShowSettings(false)}
          />
        ) : selected ? (
          <>
            <div className="px-6 pt-6 pb-2 flex items-center gap-2 shrink-0">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1">
                {selected.name}
              </h2>
              <button
                onClick={toggleContext}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
              >
                {showContext ? "Hide Details" : "Show Details"}
              </button>
              <button
                onClick={toggleBoard}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
              >
                {showBoard ? "Hide Board" : "Show Board"}
              </button>
              <button
                onClick={triggerNewTask}
                className="text-xs text-primary-foreground bg-primary hover:bg-primary/80 px-2 py-1 rounded transition-colors"
              >
                + Task
              </button>
            </div>
            {showContext && (
              <ProjectContext
                project={selected as Project}
                onSave={(updates) =>
                  updateProject({
                    projectId: selected.id,
                    updates,
                  })
                }
              />
            )}
            {showBoard && (
              <KanbanBoard
                project={selected as Project}
                columns={columns}
                onMoveTask={(taskId, newStatus) =>
                  moveTask({
                    projectId: selected.id,
                    taskId,
                    newStatus,
                  })
                }
                onAddTask={(task) =>
                  createTask({ projectId: selected.id, ...task })
                }
                onUpdateTask={(taskId, updates) =>
                  updateTask({
                    projectId: selected.id,
                    taskId,
                    updates,
                  })
                }
                onDeleteTask={(taskId) =>
                  removeTask({ projectId: selected.id, taskId })
                }
                onAddColumn={(label) => addColumn({ label })}
                newTaskTrigger={newTaskTrigger}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-xs">
              {projects.length === 0 ? (
                <>
                  <div className="text-sm font-medium text-foreground">Welcome to Mission Control</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Create a project to get started. Each project gets its own task board with drag-and-drop columns.
                  </div>
                  <button
                    onClick={() => setNewProjectTrigger((n) => n + 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    + New Project
                  </button>
                  <div className="text-[10px] text-muted-foreground/60">
                    or press <kbd className="px-1 py-0.5 rounded bg-muted text-foreground font-mono">P</kbd>
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">Select a project from the sidebar</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Dashboard />;
}
