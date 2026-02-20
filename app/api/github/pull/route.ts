import { NextResponse } from "next/server";

// Force this route to always run dynamically (never static/cached)
export const dynamic = "force-dynamic";

const REPO = "xalhexi-sch/xalhexi-sch.github.io";
const FILE_PATH = "tutorials.json";

export async function GET() {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TUTORIALS_TOKEN;
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub token not configured on server. Add GITHUB_TUTORIALS_TOKEN in the Vars section of the sidebar." },
        { status: 500 }
      );
    }

    const apiUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: err.message || `GitHub API error: ${response.status}` },
        { status: response.status }
      );
    }

    const fileData = await response.json();
    const decoded = Buffer.from(fileData.content, "base64").toString("utf-8");
    const tutorials = JSON.parse(decoded);

    if (!Array.isArray(tutorials) || tutorials.length === 0) {
      return NextResponse.json(
        { error: "Invalid tutorials format in GitHub file" },
        { status: 422 }
      );
    }

    return NextResponse.json({ tutorials });
  } catch (error) {
    console.error("Pull error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
