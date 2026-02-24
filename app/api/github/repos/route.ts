import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GITHUB_USER = "xalhexi-sch";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory cache to avoid GitHub rate limits
let cachedRepos: { data: unknown; timestamp: number } | null = null;

function githubHeaders() {
  const token = process.env.GITHUB_PUBLIC_TOKEN || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "1";

    // Return cached data if still fresh
    if (!force && cachedRepos && Date.now() - cachedRepos.timestamp < CACHE_TTL) {
      return NextResponse.json(
        { repos: cachedRepos.data },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const url = `https://api.github.com/users/${GITHUB_USER}/repos?type=public&sort=updated&per_page=100`;

    const response = await fetch(
      url,
      force
        ? { headers: githubHeaders(), cache: "no-store" }
        : { headers: githubHeaders(), next: { revalidate: 300 } }
    );

    if (!response.ok) {
      // If rate limited and we have stale cache, return it
      if (response.status === 403 && cachedRepos) {
        return NextResponse.json(
          { repos: cachedRepos.data },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
      const errorBody = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorBody}`);
    }

    const repos = await response.json();

    // Fetch languages in parallel but with fallback
    const simplified = await Promise.all(
      repos.map(async (repo: Record<string, unknown>) => {
        let languages: string[] = [];
        try {
          const langResp = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${repo.name}/languages`,
            force
              ? { headers: githubHeaders(), cache: "no-store" }
              : { headers: githubHeaders(), next: { revalidate: 300 } }
          );
          if (langResp.ok) {
            const langData = await langResp.json();
            languages = Object.keys(langData);
          }
        } catch {
          if (repo.language) languages = [repo.language as string];
        }
        return {
          name: repo.name,
          description: repo.description || "",
          language: repo.language || null,
          languages,
          updated_at: repo.updated_at,
          html_url: repo.html_url,
          default_branch: repo.default_branch || "main",
        };
      })
    );

    // Update cache
    cachedRepos = { data: simplified, timestamp: Date.now() };

    return NextResponse.json(
      { repos: simplified },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    // If we have stale cache, return it instead of erroring
    if (cachedRepos) {
      return NextResponse.json(
        { repos: cachedRepos.data },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    console.error("Repos fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch repos" },
      { status: 500 }
    );
  }
}
