import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GITHUB_USER = "xalhexi-sch";

export async function GET() {
  try {
    // Public repos don't need auth - avoid using the scoped token here
    const url = `https://api.github.com/users/${GITHUB_USER}/repos?type=public&sort=updated&per_page=100`;

    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github.v3+json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorBody}`);
    }

    const repos = await response.json();

    const simplified = repos.map((repo: Record<string, unknown>) => ({
      name: repo.name,
      description: repo.description || "",
      language: repo.language || null,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      default_branch: repo.default_branch || "main",
    }));

    return NextResponse.json({ repos: simplified });
  } catch (error) {
    console.error("Repos fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch repos" },
      { status: 500 }
    );
  }
}
