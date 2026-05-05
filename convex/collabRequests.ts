import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createCollabRequest = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in to apply.");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found.");
    }
    if (project.ownerId === identity.subject) {
      throw new Error("You cannot request your own project.");
    }

    const existing = await ctx.db
      .query("collabRequests")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const alreadyRequested = existing.some(
      (request) =>
        request.requesterId === identity.subject &&
        (request.status === "pending" || request.status === "accepted")
    );
    if (alreadyRequested) {
      throw new Error("You already have an active request for this project.");
    }

    return await ctx.db.insert("collabRequests", {
      projectId: args.projectId,
      requesterId: identity.subject,
      requesterName: identity.name ?? identity.email ?? undefined,
      status: "pending",
    });
  },
});

export const updateRequestStatus = mutation({
  args: {
    requestId: v.id("collabRequests"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in.");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found.");
    }

    const project = await ctx.db.get(request.projectId);
    if (!project) {
      throw new Error("Project not found.");
    }
    if (project.ownerId !== identity.subject) {
      throw new Error("Only project owner can update request status.");
    }

    await ctx.db.patch(args.requestId, { status: args.status });
    return { ok: true };
  },
});

export const listMyRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { sent: [], received: [] };
    }

    const userId = identity.subject;
    const sent = await ctx.db
      .query("collabRequests")
      .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      .order("desc")
      .take(200);

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .take(200);

    const received = [];
    for (const project of projects) {
      const projectRequests = await ctx.db
        .query("collabRequests")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .order("desc")
        .take(200);
      received.push(...projectRequests);
    }

    const allProjectIds = new Set([
      ...sent.map((request) => request.projectId),
      ...received.map((request) => request.projectId),
    ]);
    const projectMap = new Map();
    for (const projectId of allProjectIds) {
      const project = await ctx.db.get(projectId);
      if (project) {
        projectMap.set(projectId, project);
      }
    }

    return {
      sent: sent.map((request) => {
        const project = projectMap.get(request.projectId);
        return {
          _id: request._id,
          _creationTime: request._creationTime,
          status: request.status,
          projectId: request.projectId,
          projectTitle: project?.title ?? "Untitled Project",
          requesterId: request.requesterId,
          requesterName: request.requesterName ?? null,
          ownerId: project?.ownerId ?? "",
        };
      }),
      received: received.map((request) => {
        const project = projectMap.get(request.projectId);
        return {
          _id: request._id,
          _creationTime: request._creationTime,
          status: request.status,
          projectId: request.projectId,
          projectTitle: project?.title ?? "Untitled Project",
          requesterId: request.requesterId,
          requesterName: request.requesterName ?? null,
          ownerId: project?.ownerId ?? "",
        };
      }),
    };
  },
});
