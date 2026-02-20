import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GITHUB_USER = "xalhexi-sch";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repo = searchParams.get("repo");
    const path = searchParams.get("path") || "";

    if (!repo) {
      return NextResponse.json({ error: "repo parameter required" }, { status: 400 });
    }

    // Public repos don't need auth
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${repo}/contents/${path}`;
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/vnd.github.v3+json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    // If it's a directory, return simplified listing
    if (Array.isArray(data)) {
      const items = data.map((item: Record<string, unknown>) => ({
        name: item.name,
        type: item.type, // "file" or "dir"
        path: item.path,
        size: item.size || 0,
      }));
      // Sort: directories first, then files, alphabetically
      items.sort((a: { type: string; name: string }, b: { type: string; name: string }) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "dir" ? -1 : 1;
      });
      return NextResponse.json({ type: "dir", items });
    }

    // If it's a file, return content
    if (data.content) {
      const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
      return NextResponse.json({
        type: "file",
        name: data.name,
        path: data.path,
        size: data.size,
        content: decoded,
      });
    }

    // Large files or other types
    return NextResponse.json({
      type: "file",
      name: data.name,
      path: data.path,
      size: data.size,
      content: null,
      download_url: data.download_url,
    });
  } catch (error) {
    console.error("Contents fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch contents" },
      { status: 500 }
    );
  }
}
