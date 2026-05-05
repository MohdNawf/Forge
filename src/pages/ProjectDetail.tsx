import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createCollabRequest = useMutation(api.collabRequests.createCollabRequest);

  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const project = useQuery(
    api.projects.getProject,
    id ? { projectId: id as Id<"projects"> } : "skip"
  );

  // 🔥 Apply function
  async function apply() {
    if (!user || !id) return navigate("/auth");
    try {
      await createCollabRequest({
        projectId: id as Id<"projects">,
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (project === undefined) {
    return (
      <div className="p-12">
        <h1 className="text-4xl">Loading project...</h1>
      </div>
    );
  }

  // ❌ Project not found
  if (project === null) {
    return (
      <div className="p-12">
        <h1 className="text-4xl">Project not found</h1>
        <Link to="/discover" className="mt-4 inline-block underline">
          ← Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-12">
      <Link to="/discover" className="text-sm text-ink/60 hover:text-ink">
        ← All projects
      </Link>

      <h1 className="mt-6 text-6xl">{project.title}</h1>
      <p className="mt-3 text-xl text-ink/70">{project.tagline}</p>

      {/* Tech Stack */}
      <div className="mt-8 border-t border-rule pt-8">
        <h2 className="text-sm uppercase tracking-widest text-ink/50">
          Tech Stack
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.stack?.map((tech: string) => (
            <span key={tech} className="border border-ink px-3 py-1 text-sm">
              {tech}
            </span>
          ))}
        </div>
      </div>

     
      {status === "sent" ? (
        <p className="mt-10 text-ink/60">
          ✓ Request sent. The owner will see it.
        </p>
      ) : (
        <button
          onClick={apply}
          className="mt-10 bg-ink px-6 py-3 text-paper hover:bg-acid hover:text-ink"
        >
          {status === "error" ? "Try again" : "Apply to collaborate"}
        </button>
      )}
    </div>
  );
}