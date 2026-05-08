import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createCollabRequest = useMutation(api.collabRequests.createCollabRequest);
  const setRecruitmentStatus = useMutation(((api as any).projects.setRecruitmentStatus as any));
  const createTask = useMutation(((api as any).tasks.createTask as any));
  const updateTaskStatus = useMutation(((api as any).tasks.updateTaskStatus as any));
  const assignTask = useMutation(((api as any).tasks.assignTask as any));
  const deleteProject = useMutation(((api as any).projects.deleteProject as any));

  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const project = useQuery(
    api.projects.getProject,
    id ? { projectId: id as Id<"projects"> } : "skip"
  );

  const tasks = useQuery(
    ((api as any).tasks.listProjectTasks as any),
    id ? { projectId: id as Id<"projects"> } : "skip"
  ) as
    | Array<{
        _id: Id<"projectTasks">;
        _creationTime: number;
        projectId: Id<"projects">;
        title: string;
        status: "pending" | "in_progress" | "done";
        assigneeId?: string;
        createdBy: string;
      }>
    | null
    | undefined;

  const members = useQuery(
    ((api as any).workspace.getProjectWorkspaceMembers as any),
    id ? { projectId: id as Id<"projects"> } : "skip"
  ) as
    | Array<{
        userId: string;
        displayName: string;
        role: "leader" | "collaborator";
      }>
    | null
    | undefined;

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("");

  // 🔥 Apply function
  async function apply() {
    if (!user || !id) return navigate("/auth");
    try {
      await createCollabRequest({
        projectId: id as Id<"projects">,
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (project === undefined) {
    return (
      <div className="p-12">
        <h1 className="text-4xl">Loading project...</h1>
      </div>
    );
  }

  // ❌ Project not found
  if (project === null) {
    return (
      <div className="p-12">
        <h1 className="text-4xl">Project not found</h1>
        <Link to="/discover" className="mt-4 inline-block underline">
          ← Back to Discover
        </Link>
      </div>
    );
  }

  const isLeader = Boolean(user && project.ownerId === user.id);
  const recruitmentStatus: "open" | "closed" =
    ((project as any).recruitmentStatus as any) ?? "open";
  const recruitmentOpen = recruitmentStatus === "open";

  return (
    <div className="mx-auto max-w-3xl p-12">
      <Link to="/discover" className="text-sm text-ink/60 hover:text-ink">
        ← All projects
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-6xl">{project.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={`px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                recruitmentOpen ? "bg-acid text-ink" : "bg-ink text-paper"
              }`}
            >
              {recruitmentOpen ? (
                <>
                  <span className="forge-blink-dot" aria-hidden="true" />
                  Recruiting
                </>
              ) : (
                "Recruitment closed"
              )}
            </span>

            {isLeader && (
              <button
                onClick={async () => {
                  if (!id) return;
                  await setRecruitmentStatus({
                    projectId: id as Id<"projects">,
                    status: recruitmentOpen ? "closed" : "open",
                  });
                }}
                className="border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper"
              >
                {recruitmentOpen ? "Close recruitment" : "Re-open recruitment"}
              </button>
            )}
          </div>
        </div>

        {isLeader && (
          <button
            onClick={async () => {
              if (!id) return;
              const ok = window.confirm(
                "Delete this project? This will also delete its tasks, chat messages, and requests."
              );
              if (!ok) return;
              await deleteProject({ projectId: id as Id<"projects"> });
              navigate("/workspace");
            }}
            className="border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-800 hover:bg-rose-100"
          >
            Delete project
          </button>
        )}
      </div>
      <p className="mt-3 text-xl text-ink/70">{project.tagline}</p>

      {/* Tech Stack */}
      <div className="mt-8 border-t border-rule pt-8">
        <h2 className="text-sm uppercase tracking-widest text-ink/50">
          Tech Stack
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.stack?.map((tech: string) => (
            <span key={tech} className="border border-ink px-3 py-1 text-sm">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="mt-10 border-t border-rule pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-sm uppercase tracking-widest text-ink/50">Tasks</h2>
            <p className="mt-2 text-ink/70">
              Leader assigns. Collaborators mark{" "}
              <span className="font-medium">working</span> or{" "}
              <span className="font-medium">done</span>.
            </p>
          </div>
          {user && project.ownerId === user.id && (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!id) return;
                const title = newTaskTitle.trim();
                if (!title) return;
                await createTask({
                  projectId: id as Id<"projects">,
                  title,
                  assigneeId: newTaskAssignee || undefined,
                });
                setNewTaskTitle("");
                setNewTaskAssignee("");
              }}
            >
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a task…"
                className="w-[260px] border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
              />
              <select
                value={newTaskAssignee}
                onChange={(e) => {
                  setNewTaskAssignee(e.target.value);
                }}
                className="border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
              >
                <option value="">Unassigned</option>
                {(members ?? []).map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.displayName} {m.role === "leader" ? "(leader)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-ink px-4 py-2 text-sm text-paper hover:bg-acid hover:text-ink"
                disabled={!newTaskTitle.trim()}
              >
                Add
              </button>
            </form>
          )}
        </div>

        {!user ? (
          <div className="mt-6 border border-rule bg-paper p-5">
            <p className="text-ink/70">Sign in to view and manage tasks.</p>
          </div>
        ) : tasks === null ? (
          <div className="mt-6 border border-rule bg-paper p-5">
            <p className="text-ink/70">Tasks are only visible to project members.</p>
          </div>
        ) : tasks === undefined ? (
          <div className="mt-6 border border-rule bg-paper p-5">
            <p className="text-ink/70">Loading tasks…</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="mt-6 border border-rule bg-paper p-8 text-center">
            <p className="text-ink/70">No tasks yet.</p>
            {project.ownerId === user.id ? (
              <p className="mt-1 text-sm text-ink/60">Add the first task above.</p>
            ) : (
              <p className="mt-1 text-sm text-ink/60">Ask the leader to assign tasks.</p>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {(["pending", "in_progress", "done"] as const).map((bucket) => {
              const bucketTasks = tasks.filter((t) => t.status === bucket);
              const label =
                bucket === "pending"
                  ? "Pending"
                  : bucket === "in_progress"
                    ? "Working on it"
                    : "Done";

              return (
                <section key={bucket} className="border border-rule bg-paper">
                  <header className="flex items-center justify-between border-b border-rule px-5 py-3">
                    <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink/70">
                      {label}
                    </p>
                    <p className="text-sm text-ink/60">{bucketTasks.length}</p>
                  </header>
                  {bucketTasks.length === 0 ? (
                    <div className="px-5 py-5 text-sm text-ink/60">Nothing here.</div>
                  ) : (
                    <ul>
                      {bucketTasks.map((t) => {
                        const isLeader = project.ownerId === user.id;
                        const canUpdate = Boolean(t.assigneeId && t.assigneeId === user.id);
                        const assigneeName =
                          (members ?? []).find((m) => m.userId === t.assigneeId)?.displayName ??
                          (t.assigneeId ? `User ${t.assigneeId.slice(-6)}` : "Unassigned");

                        return (
                          <li
                            key={t._id}
                            className="border-b border-rule px-5 py-4 last:border-b-0"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-lg">{t.title}</p>
                                <p className="mt-1 text-sm text-ink/60">
                                  Assigned to{" "}
                                  {t.assigneeId ? (
                                    <Link
                                      to={`/profile/${t.assigneeId}`}
                                      className="text-ink/80 underline hover:text-ink"
                                    >
                                      {assigneeName}
                                    </Link>
                                  ) : (
                                    <span className="text-ink/80">{assigneeName}</span>
                                  )}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {isLeader && (
                                  <select
                                    value={t.assigneeId ?? ""}
                                    onChange={(e) =>
                                      void assignTask({
                                        taskId: t._id,
                                        assigneeId: e.target.value || undefined,
                                      })
                                    }
                                    className="border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
                                  >
                                    <option value="">Unassigned</option>
                                    {(members ?? []).map((m) => (
                                      <option key={m.userId} value={m.userId}>
                                        {m.displayName} {m.role === "leader" ? "(leader)" : ""}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                <button
                                  onClick={() =>
                                    void updateTaskStatus({
                                      taskId: t._id,
                                      status: "in_progress",
                                    })
                                  }
                                  disabled={!canUpdate}
                                  className="border border-ink px-3 py-2 text-xs uppercase tracking-[0.18em] hover:bg-ink hover:text-paper disabled:opacity-40"
                                >
                                  Working
                                </button>
                                <button
                                  onClick={() =>
                                    void updateTaskStatus({ taskId: t._id, status: "done" })
                                  }
                                  disabled={!canUpdate}
                                  className="border border-ink bg-ink px-3 py-2 text-xs uppercase tracking-[0.18em] text-paper hover:bg-acid hover:text-ink disabled:opacity-40"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {status === "sent" ? (
        <p className="mt-10 text-ink/60">
          ✓ Request sent. The owner will see it.
        </p>
      ) : !recruitmentOpen ? (
        <div className="mt-10 border border-rule bg-paper p-6">
          <p className="text-ink/70">Recruitment is closed for this project.</p>
        </div>
      ) : (
        <button
          onClick={apply}
          className="mt-10 bg-ink px-6 py-3 text-paper hover:bg-acid hover:text-ink"
        >
          {status === "error" ? "Try again" : "Apply to collaborate"}
        </button>
      )}
    </div>
  );
}