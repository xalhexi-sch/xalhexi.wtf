import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET: fetch the latest changelog entry (for showing persisted step diffs)
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutorial_changelog")
    .select("*")
    .order("pushed_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ entry: data || null });
}

// POST: save a new changelog entry with detailed step-level diffs
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
