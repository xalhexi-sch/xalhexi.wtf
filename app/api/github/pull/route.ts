import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

// Admin action: revalidate (sync) tutorials from GitHub
export async function POST() {
  try {
    revalidateTag("tutorials", "max");
    return NextResponse.json({ success: true, message: "Synced from GitHub. All users will see the latest." });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
