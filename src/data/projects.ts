export type Project = {
    id: string;
    title: string;
    tagline: string;
    stack: string[];
    lookingFor: string[];
  };
  
  export const projects: Project[] = [
    {
      id: "1",
      title: "Lumen",
      tagline: "Open-source Notion alternative for indie hackers.",
      stack: ["React", "Postgres", "Tauri"],
      lookingFor: ["Designer", "Backend dev"],
    },
    {
      id: "2",
      title: "Tideway",
      tagline: "AI co-pilot for solo founders running ops.",
      stack: ["Next.js", "OpenAI", "Stripe"],
      lookingFor: ["ML engineer"],
    },
    {
      id: "3",
      title: "Kiln",
      tagline: "Marketplace for handmade ceramic kits.",
      stack: ["Remix", "Shopify"],
      lookingFor: ["Frontend dev", "Marketer"],
    },
  ];
  