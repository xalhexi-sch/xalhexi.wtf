import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, postId, voteType } = await req.json();

    if (!userId || !postId || ![1, -1].includes(voteType)) {
      return NextResponse.json({ error: "Invalid vote data" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: existingVote } = await supabase
      .from("xthread_post_votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        await supabase
          .from("xthread_post_votes")
          .delete()
          .eq("id", existingVote.id);

        const { data: post } = await supabase
          .from("xthread_posts")
          .select("upvotes, downvotes")
          .eq("id", postId)
          .single();

        if (post) {
          await supabase
            .from("xthread_posts")
            .update({
              upvotes: voteType === 1 ? Math.max(0, post.upvotes - 1) : post.upvotes,
              downvotes: voteType === -1 ? Math.max(0, post.downvotes - 1) : post.downvotes,
            })
            .eq("id", postId);
        }

        return NextResponse.json({ action: "removed", voteType: null });
      } else {
        await supabase
          .from("xthread_post_votes")
          .update({ vote_type: voteType })
          .eq("id", existingVote.id);

        const { data: post } = await supabase
          .from("xthread_posts")
          .select("upvotes, downvotes")
          .eq("id", postId)
          .single();

        if (post) {
          await supabase
            .from("xthread_posts")
            .update({
              upvotes: voteType === 1 ? post.upvotes + 1 : Math.max(0, post.upvotes - 1),
              downvotes: voteType === -1 ? post.downvotes + 1 : Math.max(0, post.downvotes - 1),
            })
            .eq("id", postId);
        }

        return NextResponse.json({ action: "changed", voteType });
      }
    } else {
      await supabase
        .from("xthread_post_votes")
        .insert({ post_id: postId, user_id: userId, vote_type: voteType });

      const { data: post } = await supabase
        .from("xthread_posts")
        .select("upvotes, downvotes")
        .eq("id", postId)
        .single();

      if (post) {
        await supabase
          .from("xthread_posts")
          .update({
            upvotes: voteType === 1 ? post.upvotes + 1 : post.upvotes,
            downvotes: voteType === -1 ? post.downvotes + 1 : post.downvotes,
          })
          .eq("id", postId);
      }

      return NextResponse.json({ action: "added", voteType });
    }
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const postId = searchParams.get("postId");

    if (!userId || !postId) {
      return NextResponse.json({ error: "User ID and Post ID are required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: vote } = await supabase
      .from("xthread_post_votes")
      .select("vote_type")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    return NextResponse.json({ voteType: vote?.vote_type || null });
  } catch (error) {
    console.error("Error fetching vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
