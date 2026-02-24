import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET - Load all sessions with their messages
export async function GET() {
  const supabase = getSupabase();

  const { data: sessions, error: sessErr } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (sessErr) {
    return NextResponse.json({ sessions: [] });
  }

  // Fetch messages for all sessions in one query
  const sessionIds = (sessions || []).map((s) => s.id);
  let messages: Record<string, { id: string; role: string; content: string }[]> = {};

  if (sessionIds.length > 0) {
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("*")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: true });

    if (msgs) {
      for (const msg of msgs) {
        if (!messages[msg.session_id]) messages[msg.session_id] = [];
        messages[msg.session_id].push({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        });
      }
    }
  }

  const result = (sessions || []).map((s) => ({
    id: s.id,
    title: s.title,
    createdAt: s.created_at,
    messages: messages[s.id] || [],
  }));

  return NextResponse.json({ sessions: result });
}

// POST - Create a new session
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { id, title } = await req.json();

  const { error } = await supabase.from("chat_sessions").insert({
    id,
    title: title || "New Chat",
    created_at: Date.now(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// DELETE - Delete a session (cascade deletes messages)
export async function DELETE(req: NextRequest) {
  const supabase = getSupabase();
  const { id } = await req.json();

  const { error } = await supabase.from("chat_sessions").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// PATCH - Update session title
export async function PATCH(req: NextRequest) {
  const supabase = getSupabase();
  const { id, title } = await req.json();

  const { error } = await supabase
    .from("chat_sessions")
    .update({ title })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
