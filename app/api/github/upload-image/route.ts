import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REPO = "xalhexi-sch/xalhexi-sch.github.io";
const IMAGE_FOLDER = "tutorial-images";

export async function POST(req: NextRequest) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TUTORIALS_TOKEN;
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub token not configured on server" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, and WEBP images are allowed" },
        { status: 400 }
      );
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be under 5MB" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 50);
    const fileName = `${safeName}-${timestamp}.${ext}`;
    const filePath = `${IMAGE_FOLDER}/${fileName}`;

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Content = Buffer.from(arrayBuffer).toString("base64");

    // Check if file already exists (to get SHA for update)
    const apiUrl = `https://api.github.com/repos/${REPO}/contents/${filePath}`;
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
      // File doesn't exist, that's expected
    }

    // Upload to GitHub
    const putResp = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Upload image: ${fileName}`,
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

    const result = await putResp.json();
    // Return the raw URL for the uploaded image
    const rawUrl = result.content.download_url;

    return NextResponse.json({ success: true, url: rawUrl, path: filePath });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
