import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const userId = request.nextUrl.searchParams.get("user_id");
  const unreadOnly = request.nextUrl.searchParams.get("unread_only") === "true";

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  let query = supabase
    .from("xthread_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { user_id, type, title, message, post_id, comment_id, from_user_id } = body;

  if (!user_id || !type || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (user_id === from_user_id) {
    return NextResponse.json({ skipped: true });
  }

  const { data, error } = await supabase
    .from("xthread_notifications")
    .insert({
      user_id,
      type,
      title,
      message: message || null,
      post_id: post_id || null,
      comment_id: comment_id || null,
      from_user_id: from_user_id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { notification_id, user_id, mark_all_read } = body;

  if (mark_all_read && user_id) {
    const { error } = await supabase
      .from("xthread_notifications")
      .update({ is_read: true })
      .eq("user_id", user_id)
      .eq("is_read", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (!notification_id) {
    return NextResponse.json({ error: "notification_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("xthread_notifications")
    .update({ is_read: true })
    .eq("id", notification_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
