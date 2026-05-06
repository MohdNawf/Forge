import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";

type WorkspaceProject = {
  project: {
    _id: string;
    _creationTime: number;
    title: string;
    tagline: string;
    stack: string[];
    ownerId: string;
  };
  myRole: "leader" | "collaborator";
  members: Array<{
    userId: string;
    displayName: string;
    githubUsername?: string;
    role: "leader" | "collaborator";
  }>;
};

function rolePill(role: "leader" | "collaborator") {
  return role === "leader"
    ? "border-ink bg-ink text-paper"
    : "border-rule bg-paper text-ink/70";
}

export default function Workspace() {
  const { user, loading } = useAuth();
  const [filter, setFilter] = useState<"all" | "leader" | "collaborator">("all");

  const data = useQuery(
    // This exists at runtime once `convex/workspace.ts` is deployed.
    // The generated `api` types may lag behind until you run `npx convex dev`.
    ((api as any).workspace.listMyWorkspaceProjects as any)
  ) as WorkspaceProject[] | undefined;

  const projects = data ?? [];

  const filtered = useMemo(() => {
    if (filter === "all") return projects;
    return projects.filter((p) => p.myRole === filter);
  }, [filter, projects]);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pb-20 pt-10 md:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/70">
        § Workspace
      </p>
      <h1 className="mt-4 text-6xl leading-none md:text-8xl">
        Your projects<span className="text-acid">.</span>
      </h1>
      <p className="mt-4 max-w-[760px] text-lg text-ink/70">
        Track what you’re building right now, whether you’re leading or collaborating, and
        who’s shipping with you.
      </p>

      {!loading && !user ? (
        <section className="mt-10 border border-rule bg-paper p-8">
          <h2 className="text-3xl">Sign in to see your workspace</h2>
          <p className="mt-2 text-ink/70">
            Your workspace is personalized to the projects you own or have been accepted into.
          </p>
          <Link to="/auth" className="mt-6 inline-block bg-ink px-6 py-3 text-paper">
            Sign in
          </Link>
        </section>
      ) : !data ? (
        <section className="mt-10 border border-rule bg-paper py-20 text-center">
          <h2 className="text-4xl">Loading workspace…</h2>
        </section>
      ) : (
        <>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["leader", "Leader"],
                  ["collaborator", "Collaborator"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`border px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition ${
                    filter === key
                      ? "border-ink bg-ink text-paper"
                      : "border-rule bg-paper text-ink/70 hover:text-ink"
                  }`}
                >
                  {label}{" "}
                  {key === "all" ? (
                    <span className="ml-1 text-paper/70">{projects.length}</span>
                  ) : (
                    <span className="ml-1 text-ink/60">
                      {projects.filter((p) => p.myRole === key).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <Link
              to="/create"
              className="border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper"
            >
              New project
            </Link>
          </div>

          {filtered.length === 0 ? (
            <section className="mt-8 border border-rule bg-paper py-20 text-center">
              <h2 className="text-4xl">No projects yet.</h2>
              <p className="mt-2 text-ink/60">
                Create a project or get accepted into a team to see it here.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/discover" className="bg-ink px-6 py-3 text-paper">
                  Browse projects
                </Link>
                <Link to="/create" className="border border-ink px-6 py-3">
                  Post a project
                </Link>
              </div>
            </section>
          ) : (
            <section className="mt-8 grid gap-6 md:grid-cols-2">
              {filtered.map((row) => (
                <article key={row.project._id} className="border border-rule bg-paper p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink/70">
                        {row.myRole === "leader" ? "Leader" : "Collaborator"}
                      </p>
                      <h2 className="mt-2 text-4xl leading-none">{row.project.title}</h2>
                      <p className="mt-3 text-ink/70">{row.project.tagline}</p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${rolePill(
                        row.myRole
                      )}`}
                    >
                      {row.myRole}
                    </span>
                  </div>

                  {!!row.project.stack?.length && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {row.project.stack.slice(0, 6).map((tech) => (
                        <span
                          key={tech}
                          className="border border-rule px-3 py-1 text-xs uppercase tracking-[0.18em] text-ink/70"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  <hr className="my-6 border-rule" />

                  <div className="flex items-center justify-between gap-6">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink/70">
                        Team
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {row.members.map((m) => (
                          <Link
                            key={m.userId}
                            title={m.role}
                            to={`/profile/${m.userId}`}
                            className={`border px-3 py-1 text-sm ${
                              m.role === "leader"
                                ? "border-ink bg-acid text-ink"
                                : "border-rule bg-paper text-ink/80"
                            }`}
                          >
                            {m.displayName}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Link
                        to={`/project/${row.project._id}`}
                        className="bg-ink px-5 py-2 text-sm text-paper hover:bg-acid hover:text-ink"
                      >
                        Open
                      </Link>
                      <Link
                        to="/messages"
                        className="text-xs uppercase tracking-[0.2em] text-ink/70 hover:text-ink"
                      >
                        Go to chat ↗
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}

