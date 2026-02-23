import { NextResponse } from "next/server";

const REPO = process.env.GITHUB_REPO || "xalhexi-sch/xalhexi-sch.github.io";
const FILE_PATH = "tutorials.json";

export async function GET() {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TUTORIALS_TOKEN;
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    const apiUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

    // This fetch is cached by Next.js and tagged with 'tutorials'
    // It will serve the cached version until revalidateTag('tutorials') is called
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { tags: ["tutorials"] },
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
    console.error("Tutorials fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
