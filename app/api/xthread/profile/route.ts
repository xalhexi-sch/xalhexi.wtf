import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const username = request.nextUrl.searchParams.get("username");
  const userId = request.nextUrl.searchParams.get("user_id");

  if (!username && !userId) {
    return NextResponse.json({ error: "username or user_id is required" }, { status: 400 });
  }

  let userQuery = supabase.from("xthread_users").select("id, username, display_name, avatar_url, bio, created_at");

  if (username) {
    userQuery = userQuery.eq("username", username);
  } else {
    userQuery = userQuery.eq("id", userId);
  }

  const { data: user, error: userError } = await userQuery.single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: posts, error: postsError } = await supabase
    .from("xthread_posts")
    .select(`
      *,
      author:xthread_users!user_id(id, username, display_name, avatar_url)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  const { count: postCount } = await supabase
    .from("xthread_posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: commentCount } = await supabase
    .from("xthread_comments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: upvoteData } = await supabase
    .from("xthread_posts")
    .select("upvotes")
    .eq("user_id", user.id);

  const totalUpvotes = upvoteData?.reduce((sum, p) => sum + (p.upvotes || 0), 0) || 0;

  return NextResponse.json({
    user,
    posts: posts || [],
    stats: { posts: postCount || 0, comments: commentCount || 0, upvotes: totalUpvotes },
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { user_id, display_name, bio, avatar_url } = body;

  if (!user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const updateData: Record<string, string> = {};
  if (display_name !== undefined) updateData.display_name = display_name;
  if (bio !== undefined) updateData.bio = bio;
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

  const { data, error } = await supabase
    .from("xthread_users")
    .update(updateData)
    .eq("id", user_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
