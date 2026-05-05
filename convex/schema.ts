import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    title: v.string(),
    tagline: v.string(),
    stack: v.array(v.string()),
    ownerId: v.string(),
  }).index("by_owner", ["ownerId"]),
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
});
