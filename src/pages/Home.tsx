export default function Home() {
  const stats = [
    { value: "412", label: "Active projects" },
    { value: "9.1k", label: "Builders" },
    { value: "78%", label: "Requests answered" },
    { value: "2.4d", label: "Avg. team-up time" },
  ];

  const cards = [
    {
      id: "01",
      category: "Tools",
      status: "Recruiting",
      title: "Halftone",
      description: "An open-source publishing tool for independent magazines.",
      roles: ["Frontend Engineer", "Designer"],
      requests: 14,
      owner: "@Mira",
      postedAt: "3 days ago",
    },
    {
      id: "02",
      category: "Mobile",
      status: "Recruiting",
      title: "Fieldnote",
      description: "Voice-first field journal for ecologists and researchers.",
      roles: ["iOS Engineer", "ML Engineer"],
      requests: 22,
      owner: "@Yuki",
      postedAt: "1 week ago",
    },
    {
      id: "03",
      category: "Productivity",
      status: "In progress",
      title: "Lattice",
      description: "A new kind of spreadsheet for working with relational data.",
      roles: ["Systems Engineer", "Frontend Engineer"],
      requests: 41,
      owner: "@Aram",
      postedAt: "2 weeks ago",
      highlighted: true,
    },
  ];

  return (
    <main className="forge-home">
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-16 pt-14 md:px-10 md:pb-24">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/70">
          + Issue 001 - Spring 2026 - A new way to build together
        </p>
        <h1 className="mt-8 max-w-[760px] font-display text-6xl leading-[0.9] tracking-tight md:text-8xl">
          Ideas need
          <br />
          <em className="italic">collaborators</em>
          <span className="ml-2 text-acid">.</span>
        </h1>
        <p className="mt-10 max-w-[900px] text-2xl leading-relaxed text-ink/80">
          Forge is a project-first platform. Post what you want to build, define
          the roles you need, and let people apply with{" "}
          <span className="bg-acid px-1.5">real proposals</span> - not likes, not
          follows, not noise.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#discover"
            className="bg-ink px-7 py-3 text-lg font-semibold text-paper"
          >
            Discover projects →
          </a>
          <a href="/create" className="border border-ink px-7 py-3 text-lg">
            Post a project
          </a>
        </div>
      </section>

      <section className="border-y border-rule bg-paper py-16">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 gap-y-10 px-6 md:grid-cols-4 md:px-10">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-6xl leading-none">{stat.value}</p>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.24em] text-ink/70">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="marquee-strip">
        <div className="marquee-track">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="marquee-item">
              Project-first, not profile-first <span className="text-acid">✦</span>{" "}
              Less scrolling, more shipping <span className="text-acid">✦</span>{" "}
              Real requests, real collaborators <span className="text-acid">✦</span>
            </span>
          ))}
        </div>
      </section>

      <section
        id="discover"
        className="mx-auto w-full max-w-[1200px] px-6 pb-20 pt-24 md:px-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/70">
              § 01 - Featured
            </p>
            <h2 className="mt-4 text-6xl leading-none md:text-7xl">
              On the workbench
            </h2>
          </div>
          <a href="/discover" className="font-mono text-xs uppercase tracking-[0.24em]">
            See all projects ↗
          </a>
        </div>

        <div className="mt-12 grid gap-7 md:grid-cols-2">
          {cards.map((card) => (
           <article
           key={card.id}
           className={`border border-rule bg-paper p-8 transition
             hover:shadow-[8px_8px_0_#111] ${
               card.highlighted ? "hover:translate-y-4" : ""
             }`}
         >
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink/70">
                  {card.id} - {card.category}
                </p>
                <span
                  className={`px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                    card.status === "Recruiting"
                      ? "bg-acid text-ink"
                      : "bg-ink text-paper"
                  }`}
                >
                  {card.status}
                </span>
              </div>

              <div className="mt-7 flex items-start justify-between gap-6">
                <h3 className="text-6xl leading-none">{card.title}</h3>
                <div className="text-right">
                  <p className="font-display text-6xl leading-none">{card.requests}</p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-ink/70">
                    Requests
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-[520px] text-3xl leading-tight text-ink/85">
                {card.description}
              </p>

              <hr className="my-8 border-rule" />

              <div className="flex flex-wrap gap-3">
                {card.roles.map((role) => (
                  <span key={role} className="border border-rule px-3 py-1.5 text-sm">
                    {role}
                  </span>
                ))}
              </div>

              <p className="mt-8 font-mono text-xs uppercase tracking-[0.24em] text-ink/70">
                {card.owner} · {card.postedAt}
              </p>
            </article>
          ))}
        </div>
      </section><section className="bg-[#0f0f0d] text-paper border-y border-rule px-6 py-24 text-center md:px-10">
  <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-16 md:text-left">
    <div className="max-w-[760px]">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-paper/70">
        § 02 - How it works
      </p>
      <h2 className="mt-8 text-5xl leading-tight md:text-7xl">
        Built around <span className="text-acid italic">requests</span>, not likes.
      </h2>
    </div>
    <div className="grid gap-10 md:grid-cols-3 md:gap-12">
      <div>
        <p className="font-display text-6xl text-acid">01</p>
        <h3 className="mt-4 text-xl font-semibold">Post the idea</h3>
        <p className="mt-3 text-sm leading-relaxed text-paper/75">
          Describe what you want to build, the technologies, and the roles you need on the team.
        </p>
      </div>
      <div>
        <p className="font-display text-6xl text-acid">02</p>
        <h3 className="mt-4 text-xl font-semibold">Receive proposals</h3>
        <p className="mt-3 text-sm leading-relaxed text-paper/75">
          Builders apply with structured requests explaining what they bring — not just a “hey, I’m interested”.
        </p>
      </div>
      <div>
        <p className="font-display text-6xl text-acid">03</p>
        <h3 className="mt-4 text-xl font-semibold">Form the team</h3>
        <p className="mt-3 text-sm leading-relaxed text-paper/75">
          Accept the people you want. Each project becomes a workspace with goals, tasks, and shared context.
        </p>
      </div>
    </div>
  </div>
</section>

      <section className="border-t border-rule px-6 py-24 text-center md:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-ink/70">
          § 03 - Ready when you are
        </p>
        <h2 className="mx-auto mt-8 max-w-[960px] text-6xl leading-tight md:text-8xl">
          Stop scrolling profiles.
          <br />
          <span className="bg-acid px-3 italic">Start a project.</span>
        </h2>
        <div className="mt-10 flex justify-center gap-4">
          <a href="/create" className="bg-ink px-8 py-3 text-paper">
            Post your project
          </a>
          <a href="/discover" className="border border-ink px-8 py-3">
            Browse first
          </a>
        </div>
      </section>
    </main>
  );
}
  