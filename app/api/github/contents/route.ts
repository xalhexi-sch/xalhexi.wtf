import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GITHUB_USER = "xalhexi-sch";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory cache for file contents
const contentsCache = new Map<string, { data: unknown; timestamp: number }>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repo = searchParams.get("repo");
    const path = searchParams.get("path") || "";

    if (!repo) {
      return NextResponse.json({ error: "repo parameter required" }, { status: 400 });
    }

    const cacheKey = `${repo}/${path}`;
    const cached = contentsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${repo}/contents/${path}`;
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/vnd.github.v3+json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      // If rate limited and we have stale cache, return it
      if (response.status === 403 && cached) {
        return NextResponse.json(cached.data);
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    // If it's a directory, return simplified listing
    if (Array.isArray(data)) {
      const items = data.map((item: Record<string, unknown>) => ({
        name: item.name,
        type: item.type,
        path: item.path,
        size: item.size || 0,
      }));
      items.sort((a: { type: string; name: string }, b: { type: string; name: string }) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "dir" ? -1 : 1;
      });
      const result = { type: "dir", items };
      contentsCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    // If it's a file, return content
    if (data.content) {
      const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
      const result = { type: "file", name: data.name, path: data.path, size: data.size, content: decoded };
      contentsCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    // Large files or other types
    const result = { type: "file", name: data.name, path: data.path, size: data.size, content: null, download_url: data.download_url };
    contentsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Contents fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch contents" },
      { status: 500 }
    );
  }
}
