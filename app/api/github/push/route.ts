import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REPO = "xalhexi-sch/xalhexi-sch.github.io";
const FILE_PATH = "tutorials.json";

export async function POST(req: NextRequest) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TUTORIALS_TOKEN;
    const { tutorials } = await req.json();

    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub token not configured on server" },
        { status: 500 }
      );
    }

    if (!Array.isArray(tutorials) || tutorials.length === 0) {
      return NextResponse.json(
        { error: "Invalid tutorials data" },
        { status: 400 }
      );
    }

    const apiUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

    // Get current file SHA (needed for updates)
    let sha: string | undefined;
    try {
      const getResp = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (getResp.ok) {
        const existing = await getResp.json();
        sha = existing.sha;
      }
    } catch {
      // File doesn't exist yet, that's fine
    }

    // Encode content as base64
    const content = JSON.stringify(tutorials, null, 2);
    const base64Content = Buffer.from(content, "utf-8").toString("base64");

    // Create or update the file
    const putResp = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Update tutorials - ${new Date().toISOString()}`,
        content: base64Content,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putResp.ok) {
      const err = await putResp.json();
      return NextResponse.json(
        { error: err.message || `GitHub API error: ${putResp.status}` },
        { status: putResp.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
