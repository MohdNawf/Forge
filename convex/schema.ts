import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    title: v.string(),
    tagline: v.string(),
    stack: v.array(v.string()),
    ownerId: v.string(),
  }).index("by_owner", ["ownerId"]),
  projectTasks: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("done")),
    assigneeId: v.optional(v.string()),
    createdBy: v.string(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_and_status", ["projectId", "status"])
    .index("by_project_and_assigneeId", ["projectId", "assigneeId"])
    .index("by_project_and_createdBy", ["projectId", "createdBy"]),
  collabRequests: defineTable({
    projectId: v.id("projects"),
    requesterId: v.string(),
    requesterName: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
  })
    .index("by_project", ["projectId"])
    .index("by_requester", ["requesterId"]),
  projectMessages: defineTable({
    projectId: v.id("projects"),
    senderId: v.string(),
    body: v.string(),
  })
    .index("by_project", ["projectId"])
    .index("by_sender", ["senderId"]),

  // Public profile data used to render names in chat and show GitHub contacts.
  profiles: defineTable({
    userId: v.string(),
    displayName: v.string(),
    githubUsername: v.optional(v.string()),
    bio: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
});
