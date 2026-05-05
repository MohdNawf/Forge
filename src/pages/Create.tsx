import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Create() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const createProject = useMutation(api.projects.createProject);

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [stack, setStack] = useState("");
  const [submitError, setSubmitError] = useState("");

  // 🔐 Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!user) return; // safety check

    try {
      await createProject({
        title,
        tagline,
        stack: stack.split(",").map((s) => s.trim()),
      });
      navigate("/discover");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not publish project.");
      return;
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-12">
        <p className="text-ink/60">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-12">
      <h1 className="text-5xl">Start a project</h1>
      <p className="mt-2 text-ink/60">
        Tell builders what you're working on.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <div>
          <label className="block text-sm uppercase tracking-widest text-ink/50">
            Project name
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-2 w-full border border-ink bg-transparent p-3 outline-none focus:bg-acid"
            placeholder="Lumen"
          />
        </div>

        <div>
          <label className="block text-sm uppercase tracking-widest text-ink/50">
            One-line pitch
          </label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            required
            className="mt-2 w-full border border-ink bg-transparent p-3 outline-none focus:bg-acid"
            placeholder="Open-source Notion alternative."
          />
        </div>

        <div>
          <label className="block text-sm uppercase tracking-widest text-ink/50">
            Tech stack (comma separated)
          </label>
          <input
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            className="mt-2 w-full border border-ink bg-transparent p-3 outline-none focus:bg-acid"
            placeholder="React, Postgres, Tauri"
          />
        </div>

        {submitError && (
          <p className="text-sm text-red-700">{submitError}</p>
        )}

        <button
          type="submit"
          className="bg-ink px-6 py-3 text-paper hover:bg-acid hover:text-ink"
        >
          Publish project →
        </button>
      </form>
    </div>
  );
}