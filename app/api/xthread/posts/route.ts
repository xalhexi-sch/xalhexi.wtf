import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
      .from("xthread_posts")
      .select(`
        *,
        author:xthread_users!user_id(id, username, display_name, avatar_url)
      `)
      .order(sortBy === "upvotes" ? "upvotes" : "created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    const { count } = await supabase
      .from("xthread_posts")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      posts: posts || [],
      pagination: { page, limit, total: count || 0, hasMore: offset + limit < (count || 0) },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, content, category, tags, codeBlocks } = await req.json();

    if (!userId || !title || !content) {
      return NextResponse.json({ error: "User ID, title, and content are required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: user } = await supabase
      .from("xthread_users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const postContent = codeBlocks && codeBlocks.length > 0
      ? JSON.stringify({ text: content, codeBlocks })
      : content;

    const { data: post, error } = await supabase
      .from("xthread_posts")
      .insert({
        user_id: userId,
        title,
        content: postContent,
        category: category || "general",
        tags: tags || [],
      })
      .select(`
        *,
        author:xthread_users!user_id(id, username, display_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Error creating post:", error);
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { postId, userId, title, content, category, tags, codeBlocks } = await req.json();

    if (!postId || !userId) {
      return NextResponse.json({ error: "Post ID and User ID are required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: existingPost } = await supabase
      .from("xthread_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.user_id !== userId) {
      return NextResponse.json({ error: "Not authorized to edit this post" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title) updateData.title = title;
    if (content !== undefined) {
      updateData.content = codeBlocks && codeBlocks.length > 0
        ? JSON.stringify({ text: content, codeBlocks })
        : content;
    }
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;

    const { data: post, error } = await supabase
      .from("xthread_posts")
      .update(updateData)
      .eq("id", postId)
      .select(`
        *,
        author:xthread_users!user_id(id, username, display_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Error updating post:", error);
      return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const userId = searchParams.get("userId");

    if (!postId || !userId) {
      return NextResponse.json({ error: "Post ID and User ID are required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: existingPost } = await supabase
      .from("xthread_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.user_id !== userId) {
      return NextResponse.json({ error: "Not authorized to delete this post" }, { status: 403 });
    }

    const { error } = await supabase
      .from("xthread_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Error deleting post:", error);
      return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
