import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function canAccessProjectChat(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: string
) {
  const project = await ctx.db.get(projectId);
  if (!project) return false;
  if (project.ownerId === userId) return true;

  const requests = await ctx.db
    .query("collabRequests")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  return requests.some(
    (request) => request.requesterId === userId && request.status === "accepted"
  );
}

export const listMyProjectChats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject;
    const ownedProjects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    const ownProjectIds = new Set(ownedProjects.map((project) => project._id));

    const myRequests = await ctx.db
      .query("collabRequests")
      .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      .collect();

    const acceptedProjectIds = new Set(
      myRequests
        .filter((request) => request.status === "accepted")
        .map((request) => request.projectId)
    );

    const allProjectIds = [...new Set([...ownProjectIds, ...acceptedProjectIds])];
    const chats = [];

    for (const projectId of allProjectIds) {
      const project = await ctx.db.get(projectId);
      if (!project) continue;

      const lastMessage = await ctx.db
        .query("projectMessages")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .order("desc")
        .take(1);

      chats.push({
        projectId,
        projectTitle: project.title,
        lastMessage: lastMessage[0]?.body ?? "",
        lastMessageAt: lastMessage[0]?._creationTime ?? project._creationTime,
      });
    }

    return chats.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

export const getProjectMessages = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const allowed = await canAccessProjectChat(ctx, args.projectId, identity.subject);
    if (!allowed) {
      throw new Error("You are not a member of this project chat.");
    }

    const messages = await ctx.db
      .query("projectMessages")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .take(200);

    const senderIds = Array.from(new Set(messages.map((m) => m.senderId)));
    const senderNames: Record<string, string> = {};
    for (const senderId of senderIds) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", senderId))
        .unique();
      senderNames[senderId] = profile?.displayName?.trim() || senderId;
    }

    return messages.map((m) => ({
      ...m,
      senderName: senderNames[m.senderId],
    }));
  },
});

export const sendProjectMessage = mutation({
  args: { projectId: v.id("projects"), body: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in to send messages.");
    }

    const body = args.body.trim();
    if (!body) {
      throw new Error("Message cannot be empty.");
    }

    const allowed = await canAccessProjectChat(ctx, args.projectId, identity.subject);
    if (!allowed) {
      throw new Error("You are not a member of this project chat.");
    }

    return await ctx.db.insert("projectMessages", {
      projectId: args.projectId,
      senderId: identity.subject,
      body,
    });
  },
});
