import type { Project } from "../data/projects";
import { Link } from "react-router-dom";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/project/${project.id}`} className="block">
    <article className="border border-ink p-6 transition hover:bg-acid">
      <h2 className="font-display text-3xl">{project.title}</h2>
      <p className="mt-2 text-ink/70">{project.tagline}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <span key={tech} className="border border-ink/20 px-2 py-0.5 text-xs">
            {tech}
          </span>
        ))}
      </div>

      <p className="mt-4 text-xs uppercase tracking-widest text-ink/50">
        Looking for: {project.lookingFor.join(", ")}
      </p>
    </article>
    </Link>
  );
}
