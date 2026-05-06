import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getProfileByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    return (
      profile ?? {
        userId: args.userId,
        displayName: "",
        githubUsername: undefined,
        bio: undefined,
        portfolioUrl: undefined,
      }
    );
  },
});

export const upsertMyProfile = mutation({
  args: {
    displayName: v.string(),
    githubUsername: v.optional(v.string()),
    bio: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in to update your profile.");
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    const displayName = args.displayName.trim();
    if (!displayName) throw new Error("Display name is required.");

    const githubUsername = args.githubUsername?.trim() || undefined;
    const bio = args.bio?.trim() || undefined;
    const portfolioUrl = args.portfolioUrl?.trim() || undefined;

    if (!existing) {
      await ctx.db.insert("profiles", {
        userId: identity.subject,
        displayName,
        githubUsername,
        bio,
        portfolioUrl,
      });
      return { ok: true };
    }

    await ctx.db.patch(existing._id, {
      displayName,
      githubUsername,
      bio,
      portfolioUrl,
    });
    return { ok: true };
  },
});

