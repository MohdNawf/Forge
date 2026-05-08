import { Link } from "react-router-dom";

type ProjectCardProject = {
  id: string;
  title: string;
  tagline: string;
  stack: string[];
  recruitmentStatus?: "open" | "closed";
};

function RecruitingPill({ status }: { status: "open" | "closed" }) {
  const isOpen = status === "open";
  return (
    <span
      className={`px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
        isOpen ? "bg-acid text-ink" : "bg-ink text-paper"
      }`}
    >
      {isOpen ? (
        <>
          <span className="forge-blink-dot" aria-hidden="true" />
          Recruiting
        </>
      ) : (
        "Recruitment closed"
      )}
    </span>
  );
}

export default function ProjectCard({ project }: { project: ProjectCardProject }) {
  return (
    <Link to={`/project/${project.id}`} className="block">
      <article className="border border-rule bg-paper p-8 transition hover:shadow-[8px_8px_0_#111] hover:translate-y-1">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink/70">
            {/* You can customize this label if you have category/status */}
            • Project
          </p>
          <RecruitingPill status={project.recruitmentStatus ?? "open"} />
        </div>

        <div className="mt-7 flex items-start justify-between gap-6">
          <h2 className="text-4xl leading-none md:text-5xl">{project.title}</h2>
          
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

        
      </article>
    </Link>
  );
}