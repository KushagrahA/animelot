"use client";

import { useState } from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CommunityVoteButtonProps {
  postId: string;
  initialScore: number;
  compact?: boolean;
}

export function CommunityVoteButton({ postId, initialScore, compact = false }: CommunityVoteButtonProps) {
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState<1 | -1 | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const applyVote = async (nextVote: 1 | -1) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);

    const previousVote = vote;
    const previousScore = score;
    const nextState = previousVote === nextVote ? null : nextVote;
    const delta = (nextState ?? 0) - (previousVote ?? 0);
    setVote(nextState);
    setScore((current) => current + delta);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Sign in to vote.");
        setVote(previousVote);
        setScore(previousScore);
        return;
      }

      if (nextState == null) {
        const { error } = await supabase
          .from("community_post_votes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("community_post_votes").upsert(
          {
            user_id: user.id,
            post_id: postId,
            vote: nextState,
          },
          { onConflict: "user_id,post_id" }
        );
        if (error) throw error;
      }
    } catch {
      setVote(previousVote);
      setScore(previousScore);
      setMessage("Could not vote yet.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`community-vote ${compact ? "is-compact" : ""}`}>
      <button type="button" aria-label="Upvote" aria-pressed={vote === 1} disabled={busy} onClick={() => void applyVote(1)}>
        <ArrowBigUp size={compact ? 18 : 22} />
      </button>
      <strong>{score}</strong>
      <button type="button" aria-label="Downvote" aria-pressed={vote === -1} disabled={busy} onClick={() => void applyVote(-1)}>
        <ArrowBigDown size={compact ? 18 : 22} />
      </button>
      {message ? <span>{message}</span> : null}
    </div>
  );
}

