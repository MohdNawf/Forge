import { useQuery } from "convex/react";
import ProjectCard from "../components/Projectcard";
import { api } from "../../convex/_generated/api";

export default function Discover() {
  const projects = useQuery(api.projects.listProjects) ?? [];

  return (
    <div className="p-12">
      <h1 className="text-5xl">Discover projects</h1>
      <p className="mt-2 text-ink/60">{projects.length} projects looking for builders.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard
            key={p._id}
            project={{
              id: p._id,
              title: p.title,
              tagline: p.tagline,
              stack: p.stack,
              lookingFor: [],
            }}
          />
        ))}
      </div>
    </div>
  );
}
