import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("xthread_comments")
      .select(`
        *,
        author:xthread_users!user_id(id, username, display_name, avatar_url)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, postId, content, parentId } = await req.json();

    if (!userId || !postId || !content) {
      return NextResponse.json({ error: "User ID, Post ID, and content are required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: comment, error } = await supabase
      .from("xthread_comments")
      .insert({
        user_id: userId,
        post_id: postId,
        content,
        parent_id: parentId || null,
      })
      .select(`
        *,
        author:xthread_users!user_id(id, username, display_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    const { data: post } = await supabase
      .from("xthread_posts")
      .select("comment_count")
      .eq("id", postId)
      .single();

    if (post) {
      await supabase
        .from("xthread_posts")
        .update({ comment_count: (post.comment_count || 0) + 1 })
        .eq("id", postId);
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
