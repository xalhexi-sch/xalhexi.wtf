import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

// Admin action: revalidate the cached tutorials so ALL users get fresh data from GitHub
export async function POST() {
  try {
    // Bust the server cache -- next request to /api/tutorials will re-fetch from GitHub
    revalidateTag("tutorials");

    return NextResponse.json({ success: true, message: "Cache revalidated. All users will now see the latest tutorials from GitHub." });
  } catch (error) {
    console.error("Pull/revalidate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
