import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

// Admin action: revalidate (sync) tutorials from GitHub
export async function POST() {
  console.log("[v0] Pull route handler called");
  try {
    revalidateTag("tutorials", "max");

    return NextResponse.json({
      success: true,
      message: "Cache revalidated. All users will now see the latest tutorials from GitHub."
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}