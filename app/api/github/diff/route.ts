import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "xalhexi-sch";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");

  if (!repo || !path) {
    return NextResponse.json({ error: "Missing repo or path" }, { status: 400 });
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  try {
    // Get last 2 commits for this file
    const commitsResp = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=2`,
      { headers, next: { revalidate: 60 } }
    );

    if (!commitsResp.ok) {
      return NextResponse.json({ error: "Failed to fetch commits" }, { status: commitsResp.status });
    }

    const commits = await commitsResp.json();

    if (!Array.isArray(commits) || commits.length < 2) {
      return NextResponse.json({
        hasDiff: false,
        message: "Not enough commits to show diff",
        latestCommit: commits[0] ? {
          sha: commits[0].sha,
          message: commits[0].commit?.message,
          date: commits[0].commit?.author?.date,
        } : null,
      });
    }

    // Get file content at both commits
    const [newContent, oldContent] = await Promise.all([
      fetchFileAtCommit(repo, path, commits[0].sha, headers),
      fetchFileAtCommit(repo, path, commits[1].sha, headers),
    ]);

    // Generate unified diff
    const diff = generateUnifiedDiff(oldContent, newContent);

    return NextResponse.json({
      hasDiff: true,
      diff,
      oldCommit: {
        sha: commits[1].sha.slice(0, 7),
        message: commits[1].commit?.message?.split("\n")[0],
        date: commits[1].commit?.author?.date,
      },
      newCommit: {
        sha: commits[0].sha.slice(0, 7),
        message: commits[0].commit?.message?.split("\n")[0],
        date: commits[0].commit?.author?.date,
      },
    });
  } catch (error) {
    console.error("Diff error:", error);
    return NextResponse.json({ error: "Failed to generate diff" }, { status: 500 });
  }
}

async function fetchFileAtCommit(repo: string, path: string, sha: string, headers: Record<string, string>): Promise<string> {
  const resp = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${encodeURIComponent(path)}?ref=${sha}`,
    { headers }
  );
  if (!resp.ok) return "";
  const data = await resp.json();
  if (!data.content) return "";
  return atob(data.content.replace(/\n/g, ""));
}

function generateUnifiedDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const maxLen = Math.max(oldLines.length, newLines.length);
  let oi = 0, ni = 0;

  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
      result.push({ type: "context", content: oldLines[oi], oldNum: oi + 1, newNum: ni + 1 });
      oi++;
      ni++;
    } else {
      // Look ahead for matches
      let foundOld = -1, foundNew = -1;
      const lookAhead = Math.min(10, maxLen);

      for (let k = 1; k <= lookAhead; k++) {
        if (ni + k < newLines.length && oi < oldLines.length && oldLines[oi] === newLines[ni + k]) {
          foundNew = ni + k;
          break;
        }
        if (oi + k < oldLines.length && ni < newLines.length && oldLines[oi + k] === newLines[ni]) {
          foundOld = oi + k;
          break;
        }
      }

      if (foundNew > -1) {
        // Lines were added
        while (ni < foundNew) {
          result.push({ type: "added", content: newLines[ni], newNum: ni + 1 });
          ni++;
        }
      } else if (foundOld > -1) {
        // Lines were removed
        while (oi < foundOld) {
          result.push({ type: "removed", content: oldLines[oi], oldNum: oi + 1 });
          oi++;
        }
      } else {
        // Modified line
        if (oi < oldLines.length) {
          result.push({ type: "removed", content: oldLines[oi], oldNum: oi + 1 });
          oi++;
        }
        if (ni < newLines.length) {
          result.push({ type: "added", content: newLines[ni], newNum: ni + 1 });
          ni++;
        }
      }
    }
  }

  return result;
}

interface DiffLine {
  type: "context" | "added" | "removed";
  content: string;
  oldNum?: number;
  newNum?: number;
}
