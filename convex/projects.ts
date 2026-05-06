import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").order("desc").collect();
  },
});

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

export const createProject = mutation({
  args: {
    title: v.string(),
    tagline: v.string(),
    stack: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in to publish a project.");
    }

    return await ctx.db.insert("projects", {
      title: args.title,
      tagline: args.tagline,
      stack: args.stack,
      ownerId: identity.subject,
    });
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must be signed in.");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found.");
    if (project.ownerId !== identity.subject) {
      throw new Error("Only the project owner can delete this project.");
    }

    // Cascade delete related documents (bounded batches).
    const deleteByIndex = async (
      table: "collabRequests" | "projectMessages" | "projectTasks"
    ) => {
      const index =
        table === "collabRequests"
          ? "by_project"
          : table === "projectMessages"
            ? "by_project"
            : "by_project";

      let total = 0;
      while (true) {
        const batch = await ctx.db
          .query(table)
          .withIndex(index as any, (q) => q.eq("projectId", args.projectId))
          .take(200);
        if (batch.length === 0) break;
        for (const doc of batch) {
          await ctx.db.delete(doc._id);
        }
        total += batch.length;
        if (total > 5000) {
          throw new Error("Project has too much data to delete in one operation.");
        }
      }
    };

    await deleteByIndex("projectTasks");
    await deleteByIndex("projectMessages");
    await deleteByIndex("collabRequests");

    await ctx.db.delete(args.projectId);
    return { ok: true };
  },
});
