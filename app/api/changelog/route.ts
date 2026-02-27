import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET: fetch changelog entries (latest first, limit 50)
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutorial_changelog")
    .select("*")
    .order("pushed_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ entries: data });
}

// POST: save a new changelog entry
export async function POST(req: Request) {
  const { changes } = await req.json();
  if (!Array.isArray(changes) || changes.length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutorial_changelog")
    .insert({ changes });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
