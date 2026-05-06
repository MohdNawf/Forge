import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { v } from "convex/values";

type WorkspaceMember = {
  userId: string;
  displayName: string;
  githubUsername?: string;
  role: "leader" | "collaborator";
};

type WorkspaceProject = {
  project: Doc<"projects">;
  myRole: "leader" | "collaborator";
  members: WorkspaceMember[];
};

function displayNameFallback(userId: string) {
  return `User ${userId.slice(-6)}`;
}

async function isProjectMember(ctx: any, projectId: Id<"projects">, userId: string) {
  const project = await ctx.db.get(projectId);
  if (!project) return false;
  if (project.ownerId === userId) return true;
  const requests = await ctx.db
    .query("collabRequests")
    .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
    .order("desc")
    .take(200);
  return requests.some((r: any) => r.requesterId === userId && r.status === "accepted");
}

export const listMyWorkspaceProjects = query({
  args: {},
  handler: async (ctx): Promise<WorkspaceProject[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject;

    const ownedProjects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .take(200);

    const myRequests = await ctx.db
      .query("collabRequests")
      .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      .order("desc")
      .take(200);

    const acceptedProjectIds = new Set(
      myRequests
        .filter((request) => request.status === "accepted")
        .map((request) => request.projectId)
    );

    const projectsById = new Map<Id<"projects">, Doc<"projects">>();
    for (const project of ownedProjects) projectsById.set(project._id, project);
    for (const projectId of acceptedProjectIds) {
      if (projectsById.has(projectId)) continue;
      const project = await ctx.db.get(projectId);
      if (project) projectsById.set(projectId, project);
    }

    const rows: WorkspaceProject[] = [];

    for (const project of projectsById.values()) {
      const myRole: WorkspaceProject["myRole"] =
        project.ownerId === userId ? "leader" : "collaborator";

      const acceptedCollaborators = await ctx.db
        .query("collabRequests")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .order("desc")
        .take(200);

      const collaboratorIds = acceptedCollaborators
        .filter((r) => r.status === "accepted")
        .map((r) => r.requesterId);

      const memberIds = Array.from(new Set([project.ownerId, ...collaboratorIds]));

      const members: WorkspaceMember[] = [];
      for (const memberId of memberIds) {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", memberId))
          .unique();

        members.push({
          userId: memberId,
          displayName: profile?.displayName?.trim() || displayNameFallback(memberId),
          githubUsername: profile?.githubUsername,
          role: memberId === project.ownerId ? "leader" : "collaborator",
        });
      }

      rows.push({ project, myRole, members });
    }

    return rows.sort((a, b) => b.project._creationTime - a.project._creationTime);
  },
});

export const getProjectWorkspaceMembers = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args): Promise<WorkspaceMember[] | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const allowed = await isProjectMember(ctx, args.projectId, identity.subject);
    if (!allowed) return null;

    const requests = await ctx.db
      .query("collabRequests")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(200);

    const memberIds = Array.from(
      new Set([
        project.ownerId,
        ...requests.filter((r) => r.status === "accepted").map((r) => r.requesterId),
      ])
    );

    const members: WorkspaceMember[] = [];
    for (const memberId of memberIds) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", memberId))
        .unique();

      members.push({
        userId: memberId,
        displayName: profile?.displayName?.trim() || displayNameFallback(memberId),
        githubUsername: profile?.githubUsername,
        role: memberId === project.ownerId ? "leader" : "collaborator",
      });
    }

    return members;
  },
});

export const listWorkspaceProjectsByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const ownedProjects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .take(200);

    const requests = await ctx.db
      .query("collabRequests")
      .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      .order("desc")
      .take(200);

    const acceptedProjectIds = Array.from(
      new Set(
        requests.filter((r) => r.status === "accepted").map((r) => r.projectId)
      )
    );

    const projects: Array<{
      project: Doc<"projects">;
      role: "leader" | "collaborator";
    }> = ownedProjects.map((p) => ({ project: p, role: "leader" as const }));

    const seen = new Set(ownedProjects.map((p) => p._id));
    for (const projectId of acceptedProjectIds) {
      if (seen.has(projectId)) continue;
      const p = await ctx.db.get(projectId);
      if (!p) continue;
      projects.push({ project: p, role: "collaborator" as const });
      seen.add(projectId);
    }

    return projects.sort((a, b) => b.project._creationTime - a.project._creationTime);
  },
});

