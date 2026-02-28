import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET: Fetch messages for a channel
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel") || "public";
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
  const before = searchParams.get("before"); // cursor for pagination

  const supabase = await createClient();
  let query = supabase
    .from("community_messages")
    .select("*")
    .eq("channel", channel)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: (data || []).reverse() });
}

// POST: Send a new message
export async function POST(req: Request) {
  const body = await req.json();
  const { channel, sender_name, sender_role, message, file_url, file_name, file_size, file_type } = body;

  if (!sender_name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!message?.trim() && !file_url) {
    return NextResponse.json({ error: "Message or file is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_messages")
    .insert({
      channel: channel || "public",
      sender_name: sender_name.trim(),
      sender_role: sender_role || "user",
      message: message?.trim() || null,
      file_url: file_url || null,
      file_name: file_name || null,
      file_size: file_size || null,
      file_type: file_type || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}

// Verify JWT and extract role
async function verifyToken(token: string): Promise<string | null> {
  try {
    const SECRET = process.env.JWT_SECRET;
    if (!SECRET) return null;
    const [header, payload, signature] = token.split(".");
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const data = enc.encode(`${header}.${payload}`);
    const sigBytes = Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, data);
    if (!valid) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded.role || null;
  } catch {
    return null;
  }
}

// DELETE: Admin-only delete a message (and optionally its file)
export async function DELETE(req: Request) {
  const { id, token } = await req.json();

  const role = await verifyToken(token || "");
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Message ID required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Get the message first to check for file
  const { data: msg } = await supabase
    .from("community_messages")
    .select("file_url")
    .eq("id", id)
    .single();

  // Delete from Blob if it has a file
  if (msg?.file_url) {
    try {
      const { del } = await import("@vercel/blob");
      await del(msg.file_url);
    } catch {
      // Blob deletion failed, continue with message deletion
    }
  }

  const { error } = await supabase
    .from("community_messages")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
