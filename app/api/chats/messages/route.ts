import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// POST - Save a message
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { id, session_id, role, content } = await req.json();

  const { error } = await supabase.from("chat_messages").upsert({
    id,
    session_id,
    role,
    content,
    created_at: Date.now(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
