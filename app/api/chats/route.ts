import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO || "xalhexi-sch/xalhexi-sch.github.io";
const FILE_PATH = "chats.json";

export async function GET() {
  const GITHUB_TOKEN = process.env.GITHUB_TUTORIALS_TOKEN;
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ chats: [] });
  }

  try {
    const apiUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
    const resp = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    });

    if (!resp.ok) {
      return NextResponse.json({ chats: [] });
    }

    const data = await resp.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const chats = JSON.parse(content);
    return NextResponse.json({ chats, sha: data.sha });
  } catch {
    return NextResponse.json({ chats: [] });
  }
}

export async function POST(req: NextRequest) {
  const GITHUB_TOKEN = process.env.GITHUB_TUTORIALS_TOKEN;
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 });
  }

  try {
    const { chats } = await req.json();
    if (!Array.isArray(chats)) {
      return NextResponse.json({ error: "Invalid chats data" }, { status: 400 });
    }

    const apiUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

    // Get current SHA
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
    } catch { /* file doesn't exist yet */ }

    // Keep only last 100 chats, each with max 50 messages
    const trimmed = chats.slice(0, 100).map((c: { messages?: unknown[] }) => ({
      ...c,
      messages: Array.isArray(c.messages) ? c.messages.slice(-50) : [],
    }));

    const content = JSON.stringify(trimmed, null, 2);
    const base64Content = Buffer.from(content, "utf-8").toString("base64");

    const putResp = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Update chat history - ${new Date().toISOString()}`,
        content: base64Content,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putResp.ok) {
      const err = await putResp.json();
      return NextResponse.json({ error: err.message || "GitHub API error" }, { status: putResp.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
