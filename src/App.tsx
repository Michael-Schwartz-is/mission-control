import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/auth";
import { LoginPage } from "@/components/LoginPage";
import { Sidebar } from "@/components/Sidebar";
import { ProjectDetails } from "@/components/ProjectDetails";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SettingsPage } from "@/components/SettingsPage";
import { AdminPage } from "@/components/AdminPage";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { Project } from "@/types";
import { t, setLanguage, isRtl } from "@/i18n";

function ProjectMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-1 rounded hover:bg-muted transition-colors"
      >
        ...
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-md z-50 py-1 min-w-[120px]">
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
          >
            Delete project
          </button>
        </div>
      )}
    </div>
  );
}

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
  const adminStats = useQuery(api.admin.stats);
  const isAdmin = adminStats !== null && adminStats !== undefined;
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
  const removeColumn = useMutation(api.columns.remove);
  const setGlobalContext = useMutation(api.globalContext.set);

  const [selectedId, setSelectedId] = useState<string | null>(() =>
    readPref("selectedId", null)
  );
  const [activeTab, setActiveTab] = useState<"board" | "details">(() =>
    readPref("activeTab", "board")
  );
  const [showSidebar, setShowSidebar] = useState(() =>
    readPref("showSidebar", window.innerWidth > 640)
  );
  const [newTaskTrigger, setNewTaskTrigger] = useState(0);
  const [newProjectTrigger, setNewProjectTrigger] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [lang, setLang] = useState(() => {
    const saved = readPref("lang", "en");
    setLanguage(saved);
    return saved;
  });
  const [, forceUpdate] = useState(0);

  const handleLangChange = useCallback((newLang: string) => {
    setLang(newLang);
    setLanguage(newLang);
    writePref("lang", newLang);
    forceUpdate((n) => n + 1); // re-render with new translations
  }, []);

  const rtl = isRtl();

  const effectiveSelectedId =
    selectedId && projects.some((p) => p.id === selectedId)
      ? selectedId
      : projects[0]?.id ?? null;

  const handleSelectProject = useCallback((id: string) => {
    setSelectedId(id);
    writePref("selectedId", id);
  }, []);

  const switchTab = useCallback((tab: "board" | "details") => {
    setActiveTab(tab);
    writePref("activeTab", tab);
  }, []);

  const toggleSidebar = useCallback(() => {
    setShowSidebar((v) => {
      writePref("showSidebar", !v);
      return !v;
    });
  }, []);

  const triggerNewTask = useCallback(() => {
    switchTab("board");
    setNewTaskTrigger((n) => n + 1);
  }, [switchTab]);

  useKeyboardShortcuts({
    n: triggerNewTask,
    p: () => setNewProjectTrigger((n) => n + 1),
    b: () => switchTab("board"),
    d: () => switchTab("details"),
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
            setShowAdmin(false);
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
          onSettingsClick={() => { setShowSettings(true); setShowAdmin(false) }}
          onAdminClick={isAdmin ? () => { setShowAdmin(true); setShowSettings(false) } : undefined}
          onLogout={() => void signOut()}
          newProjectTrigger={newProjectTrigger}
          inSettings={showSettings}
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
        {showAdmin ? (
          <AdminPage />
        ) : showSettings ? (
          <SettingsPage
            globalContext={globalContext}
            onGlobalChange={(data) =>
              setGlobalContext({ data: JSON.stringify(data) })
            }
            lang={lang}
            onLangChange={handleLangChange}
            onClose={() => setShowSettings(false)}
          />
        ) : selected ? (
          <>
            {/* Mobile: name on own line, tabs + actions below */}
            <div className="sm:hidden px-4 pt-4 pb-1 shrink-0">
              <h2 className="text-sm font-medium text-foreground">{selected.name}</h2>
            </div>
            <div className="sm:hidden px-4 pb-0 flex items-center gap-1 shrink-0">
              {(["board", "details"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={`text-xs px-2.5 py-1.5 rounded transition-colors ${
                    activeTab === tab
                      ? "text-foreground bg-muted font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(tab)}
                </button>
              ))}
              {activeTab === "board" && (
                <button
                  onClick={triggerNewTask}
                  className="text-xs text-foreground bg-muted hover:bg-muted-foreground/20 px-2.5 py-1.5 rounded transition-colors"
                >
                  {t('new_task')}
                </button>
              )}
              <div className="flex-1" />
              <ProjectMenu
                onDelete={async () => {
                  if (!confirm(`${t('delete_project')}: "${selected.name}"?`)) return;
                  await removeProject({ projectId: selected.id });
                  const remaining = projects.filter((p) => p.id !== selected.id);
                  handleSelectProject(remaining[0]?.id ?? "");
                }}
              />
            </div>
            {/* Desktop: original layout */}
            <div className="hidden sm:flex px-6 pt-5 pb-0 items-center gap-4 shrink-0">
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-sm font-medium text-foreground">{selected.name}</h2>
                <div className="flex gap-0.5">
                  {(["board", "details"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => switchTab(tab)}
                      className={`text-xs px-3 py-1.5 rounded-t-md transition-colors relative ${
                        activeTab === tab
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t(tab)}
                      {activeTab === tab && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {activeTab === "board" && (
                <button
                  onClick={triggerNewTask}
                  className="text-xs text-foreground bg-muted hover:bg-muted-foreground/20 px-2.5 py-1 rounded transition-colors"
                >
                  {t('new_task')}
                </button>
              )}
              <ProjectMenu
                onDelete={async () => {
                  if (!confirm(`${t('delete_project')}: "${selected.name}"?`)) return;
                  await removeProject({ projectId: selected.id });
                  const remaining = projects.filter((p) => p.id !== selected.id);
                  handleSelectProject(remaining[0]?.id ?? "");
                }}
              />
            </div>
            {activeTab === "details" ? (
              <ProjectDetails
                project={selected as Project}
                onSave={(updates) =>
                  updateProject({
                    projectId: selected.id,
                    updates,
                  })
                }
              />
            ) : (
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
                onDeleteColumn={(columnId) => removeColumn({ columnId })}
                newTaskTrigger={newTaskTrigger}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-xs">
              {projects.length === 0 ? (
                <>
                  <div className="text-sm font-medium text-foreground">{t('welcome')}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{t('welcome_desc')}</div>
                  <button
                    onClick={() => setNewProjectTrigger((n) => n + 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    {t('new_project')}
                  </button>
                  <div className="text-[10px] text-muted-foreground/60">
                    {t('or_press')} <kbd className="px-1 py-0.5 rounded bg-muted text-foreground font-mono">P</kbd>
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">{t('select_project')}</div>
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
