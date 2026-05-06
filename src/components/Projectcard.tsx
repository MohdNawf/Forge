import type { Project } from "../data/projects";
import { Link } from "react-router-dom";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/project/${project.id}`} className="block">
      <article className="border border-rule bg-paper p-8 transition hover:shadow-[8px_8px_0_#111] hover:translate-y-1">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink/70">
            {/* You can customize this label if you have category/status */}
            • Project
          </p>
          {/* Optional status pill – remove if you don’t have one */}
          {/* <span className="bg-ink px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-paper">
            Active
          </span> */}
        </div>

        <div className="mt-7 flex items-start justify-between gap-6">
          <h2 className="text-4xl leading-none md:text-5xl">{project.title}</h2>
          {/* If you have a numeric stat (e.g. requests), show it here; otherwise remove this block */}
          {/* <div className="text-right">
            <p className="font-display text-4xl leading-none">12</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-ink/70">
              Requests
            </p>
          </div> */}
        </div>

        <p className="mt-6 max-w-[520px] text-lg leading-tight text-ink/85">
          {project.tagline}
        </p>

        <hr className="my-8 border-rule" />

        <div className="flex flex-wrap gap-3">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="border border-rule px-3 py-1.5 text-sm"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Optional footer line – wire this up if you have owner/postedAt */}
        {/* <p className="mt-8 font-mono text-xs uppercase tracking-[0.24em] text-ink/70">
          @Owner · 3 days ago
        </p> */}
      </article>
    </Link>
  );
}