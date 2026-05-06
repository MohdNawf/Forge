import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";

type GitHubRepo = {
  id: number | string;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
};

type GitHubUserSummary = {
  public_repos: number;
  followers: number;
  following: number;
};

type ContributionDay = {
  date: string;
  contributionCount: number;
  color: string;
};

type ContributionWeek = {
  contributionDays: ContributionDay[];
};

type ContributionCalendar = {
  totalContributions: number;
  weeks: ContributionWeek[];
};

async function fetchGitHubRepos(githubUsername: string): Promise<GitHubRepo[]> {
  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(
      githubUsername
    )}/repos?per_page=6&sort=updated`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub request failed (${res.status})`);
  }

  return (await res.json()) as GitHubRepo[];
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const params = useParams();
  const viewingUserId = params.userId ?? user?.id ?? null;

  const isOwner = user?.id && viewingUserId ? user.id === viewingUserId : false;

  const profile = useQuery(
    api.profiles.getProfileByUserId,
    viewingUserId ? { userId: viewingUserId } : "skip"
  );

  const upsertMyProfile = useMutation(api.profiles.upsertMyProfile);

  const [displayName, setDisplayName] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setGithubUsername(profile.githubUsername ?? "");
    setBio(profile.bio ?? "");
    setPortfolioUrl(profile.portfolioUrl ?? "");
  }, [profile]);

  const projects = useQuery(
    ((api as any).workspace.listWorkspaceProjectsByUserId as any),
    viewingUserId ? { userId: viewingUserId } : "skip"
  ) as
    | Array<{
        project: { _id: string; title: string; tagline: string; stack: string[] };
        role: "leader" | "collaborator";
      }>
    | undefined;

  const [repos, setRepos] = useState<GitHubRepo[] | null>(null);
  const [reposError, setReposError] = useState<string | null>(null);
  const [userSummary, setUserSummary] = useState<GitHubUserSummary | null>(null);

  const getContributionCalendar = useAction(
    // This exists at runtime once `convex/github.ts` is deployed.
    // The generated `api` types may lag behind until you run `npx convex dev`.
    ((api as any).github.getContributionCalendar as any)
  );
  const [contribs, setContribs] = useState<ContributionCalendar | null>(null);
  const [contribsError, setContribsError] = useState<string | null>(null);
  const [contribsLoading, setContribsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const username = githubUsername.trim();
      if (!username) {
        setRepos(null);
        setReposError(null);
        setUserSummary(null);
        setContribs(null);
        setContribsError(null);
        return;
      }

      setReposError(null);
      try {
        const data = await fetchGitHubRepos(username);
        if (!cancelled) setRepos(data);

        // Fetch high-level GitHub stats for the header summary.
        const userRes = await fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}`,
          {
            headers: { Accept: "application/vnd.github+json" },
          }
        );
        if (userRes.ok) {
          const json = (await userRes.json()) as GitHubUserSummary;
          if (!cancelled) {
            setUserSummary({
              public_repos: json.public_repos,
              followers: json.followers,
              following: json.following,
            });
          }
        } else if (!cancelled) {
          setUserSummary(null);
        }
      } catch (err) {
        if (!cancelled) {
          setRepos(null);
          setReposError(err instanceof Error ? err.message : "Failed to load repos.");
          setUserSummary(null);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [githubUsername]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const username = githubUsername.trim();
      if (!username) return;

      setContribsLoading(true);
      setContribsError(null);
      try {
        const cal = (await getContributionCalendar({
          username,
        })) as ContributionCalendar;
        if (!cancelled) setContribs(cal);
      } catch (err) {
        if (!cancelled) {
          setContribs(null);
          setContribsError(
            err instanceof Error ? err.message : "Failed to load contributions."
          );
        }
      } finally {
        if (!cancelled) setContribsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [getContributionCalendar, githubUsername]);

  const canEdit = Boolean(user && isOwner);

  const headerName = useMemo(() => {
    const dn = displayName.trim();
    if (dn) return dn;
    return viewingUserId ? `User ${viewingUserId.slice(0, 6)}` : "Profile";
  }, [displayName, viewingUserId]);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8 md:px-10">
      {!viewingUserId ? (
        <div className="border border-rule bg-paper p-6">
          <h1 className="text-3xl">Sign in to view your profile</h1>
        </div>
      ) : (
        <section className="border border-rule bg-paper">
          <header className="flex items-start justify-between gap-4 border-b border-rule px-6 py-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink/70">
                § Profile
              </p>
              <h1 className="mt-2 text-4xl">{headerName}</h1>
              {!canEdit && (
                <p className="mt-2 text-sm text-ink/70">
                  Viewing another profile. Contact details are read-only.
                </p>
              )}
            </div>
            {canEdit && (
              <button
                onClick={async () => {
                  await signOut();
                  window.location.href = "/";
                }}
                className="border border-rule px-4 py-2 text-sm hover:bg-ink hover:text-paper"
              >
                Sign out
              </button>
            )}
          </header>

          <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
            <div className="space-y-6">
              {githubUsername.trim() && userSummary && (
                <div className="grid grid-cols-3 gap-3 border border-rule bg-paper px-4 py-3 text-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-ink/60">
                      Public repos
                    </p>
                    <p className="mt-1 font-display text-2xl">
                      {userSummary.public_repos}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-ink/60">
                      Followers
                    </p>
                    <p className="mt-1 font-display text-2xl">
                      {userSummary.followers}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-ink/60">
                      Following
                    </p>
                    <p className="mt-1 font-display text-2xl">
                      {userSummary.following}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm uppercase tracking-widest text-ink/50">
                  Display name
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!canEdit}
                  className="mt-2 w-full border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink disabled:opacity-50"
                  placeholder="e.g. Mira"
                />
              </div>

              <div>
                <label className="block text-sm uppercase tracking-widest text-ink/50">
                  GitHub username
                </label>
                <input
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  disabled={!canEdit}
                  className="mt-2 w-full border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink disabled:opacity-50"
                  placeholder="e.g. mona-labs"
                />
              </div>

              <div>
                <label className="block text-sm uppercase tracking-widest text-ink/50">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!canEdit}
                  className="mt-2 min-h-[110px] w-full resize-y border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink disabled:opacity-50"
                  placeholder="A short bio about you…"
                />
              </div>

              <div>
                <label className="block text-sm uppercase tracking-widest text-ink/50">
                  Portfolio website
                </label>
                <input
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  disabled={!canEdit}
                  className="mt-2 w-full border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink disabled:opacity-50"
                  placeholder="https://your-site.com"
                />
              </div>

              {canEdit ? (
                <button
                  onClick={() =>
                    void upsertMyProfile({
                      displayName,
                      githubUsername: githubUsername.trim() || undefined,
                      bio: bio.trim() || undefined,
                      portfolioUrl: portfolioUrl.trim() || undefined,
                    })
                  }
                  className="bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-acid hover:text-ink"
                  disabled={!displayName.trim()}
                >
                  Save profile
                </button>
              ) : (
                <p className="text-sm text-ink/70">
                  Set your display name in your own profile to have it appear in chat.
                </p>
              )}

              {reposError && (
                <p className="text-sm text-ink/70">
                  Could not load GitHub repos: {reposError}
                </p>
              )}

              {!canEdit && (bio.trim() || portfolioUrl.trim()) && (
                <div className="border border-rule bg-paper p-4">
                  {bio.trim() && <p className="text-sm text-ink/80">{bio.trim()}</p>}
                  {portfolioUrl.trim() && (
                    <a
                      href={portfolioUrl.trim()}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm underline text-ink/80 hover:text-ink"
                    >
                      Portfolio ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink/70">
                  Projects
                </p>
                {!projects ? (
                  <p className="mt-4 text-sm text-ink/70">Loading projects...</p>
                ) : projects.length === 0 ? (
                  <p className="mt-4 text-sm text-ink/70">No projects yet.</p>
                ) : (
                  <ul className="mt-4 grid gap-3">
                    {projects.map((p) => (
                      <li key={p.project._id} className="border border-rule bg-paper px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-display text-lg">{p.project.title}</p>
                            <p className="mt-1 text-sm text-ink/70">{p.project.tagline}</p>
                          </div>
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
                              p.role === "leader"
                                ? "border-ink bg-acid text-ink"
                                : "border-rule bg-paper text-ink/70"
                            }`}
                          >
                            {p.role}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(p.project.stack ?? []).slice(0, 6).map((tech) => (
                            <span
                              key={tech}
                              className="border border-rule px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-ink/65"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                        <a
                          href={`/project/${p.project._id}`}
                          className="mt-3 inline-block text-sm underline text-ink/80 hover:text-ink"
                        >
                          Open project →
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink/70">
                  Repositories
                </p>

                {githubUsername.trim() ? (
                  repos ? (
                    <ul className="mt-4 grid gap-4 md:grid-cols-2">
                      {repos.map((r) => (
                        <li
                          key={r.id}
                          className="border border-rule bg-paper px-4 py-3 text-left"
                        >
                          <a
                            href={r.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-display text-lg hover:underline"
                          >
                            {r.name}
                          </a>
                          <p className="mt-1 text-sm text-ink/70">
                            {r.description ?? "No description"}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-xs text-ink/60">
                            <span>{r.language ?? "Unknown"}</span>
                            <span>★ {r.stargazers_count}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-ink/70">Loading repos...</p>
                  )
                ) : (
                  <p className="mt-4 text-sm text-ink/70">
                    Add your GitHub username to see repos.
                  </p>
                )}
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink/70">
                  Contributions
                </p>

                {githubUsername.trim() ? (
                  <div className="mt-4">
                    {contribsError ? (
                      <p className="text-sm text-ink/70">
                        Could not load contributions: {contribsError}
                      </p>
                    ) : contribsLoading && !contribs ? (
                      <p className="text-sm text-ink/70">Loading contributions...</p>
                    ) : contribs?.weeks?.length ? (
                      <div className="rounded-md border border-rule bg-white p-3">
                        <p className="mb-3 text-xs text-ink/70">
                          {contribs.totalContributions} contributions in the last year
                        </p>
                        <div className="overflow-x-auto">
                          <div className="inline-flex gap-[3px]">
                            {contribs.weeks.map((w, wi) => (
                              <div key={wi} className="flex flex-col gap-[3px]">
                                {w.contributionDays.map((d) => (
                                  <div
                                    key={d.date}
                                    title={`${d.contributionCount} contributions on ${d.date}`}
                                    className="h-[10px] w-[10px] rounded-[2px] border border-black/5"
                                    style={{ backgroundColor: d.color }}
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-ink/70">
                        No contribution data available.
                      </p>
                    )}
                    
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-ink/70">
                    Add your GitHub username to see contributions.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

