import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

type TaskStatus = "pending" | "in_progress" | "done";

async function isProjectLeader(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: string
) {
  const project = await ctx.db.get(projectId);
  return Boolean(project && project.ownerId === userId);
}

async function isProjectMember(
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
    .order("desc")
    .take(200);

  return requests.some((r) => r.requesterId === userId && r.status === "accepted");
}

export const listProjectTasks = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const allowed = await isProjectMember(ctx, args.projectId, identity.subject);
    if (!allowed) {
      return null;
    }

    return await ctx.db
      .query("projectTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(500);
  },
});

export const createTask = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    assigneeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must be signed in.");

    const title = args.title.trim();
    if (!title) throw new Error("Task title is required.");

    const leader = await isProjectLeader(ctx, args.projectId, identity.subject);
    if (!leader) {
      throw new Error("Only the project leader can create tasks.");
    }

    if (args.assigneeId) {
      const allowed = await isProjectMember(ctx, args.projectId, args.assigneeId);
      if (!allowed) throw new Error("Assignee must be a project member.");
    }

    return await ctx.db.insert("projectTasks", {
      projectId: args.projectId,
      title,
      status: "pending",
      assigneeId: args.assigneeId,
      createdBy: identity.subject,
    });
  },
});

export const assignTask = mutation({
  args: { taskId: v.id("projectTasks"), assigneeId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must be signed in.");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found.");

    const leader = await isProjectLeader(ctx, task.projectId, identity.subject);
    if (!leader) throw new Error("Only the project leader can assign tasks.");

    if (args.assigneeId) {
      const allowed = await isProjectMember(ctx, task.projectId, args.assigneeId);
      if (!allowed) throw new Error("Assignee must be a project member.");
    }

    await ctx.db.patch(args.taskId, { assigneeId: args.assigneeId });

    return { ok: true };
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("projectTasks"),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must be signed in.");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found.");

    const member = await isProjectMember(ctx, task.projectId, identity.subject);
    if (!member) throw new Error("You are not a member of this project.");

    // Only assignee can update status (leader can update only if assigned to themselves).
    if (task.assigneeId !== identity.subject) {
      throw new Error("Only the assignee can update task status.");
    }

    const status: TaskStatus = args.status;
    await ctx.db.patch(args.taskId, { status });
    return { ok: true };
  },
});

