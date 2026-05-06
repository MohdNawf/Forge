"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

type ContributionDay = {
  date: string;
  contributionCount: number;
  color: string;
};

type ContributionWeek = {
  contributionDays: ContributionDay[];
};

type ContributionCalendar = {
  totalContributions: number;
  weeks: ContributionWeek[];
};

export const getContributionCalendar = action({
  args: { username: v.string() },
  handler: async (_ctx, args): Promise<ContributionCalendar> => {
    const username = args.username.trim();
    if (!username) {
      return { totalContributions: 0, weeks: [] };
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error(
        "Missing GITHUB_TOKEN. Set it in your Convex environment to fetch GitHub contributions."
      );
    }

    const query = `
      query($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  color
                }
              }
            }
          }
        }
      }
    `;

    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${token}`,
      },
      body: JSON.stringify({ query, variables: { login: username } }),
    });

    if (!res.ok) {
      throw new Error(`GitHub request failed (${res.status})`);
    }

    const json = (await res.json()) as any;
    if (json.errors?.length) {
      throw new Error(json.errors[0]?.message ?? "GitHub GraphQL error");
    }

    const cal =
      json.data?.user?.contributionsCollection?.contributionCalendar ?? null;
    if (!cal) {
      return { totalContributions: 0, weeks: [] };
    }

    return {
      totalContributions: cal.totalContributions ?? 0,
      weeks: (cal.weeks ?? []) as ContributionWeek[],
    };
  },
});

