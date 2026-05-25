"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CommentWithUser } from "@/lib/supabase/types";
import { displayUser, initials, relativeDate } from "./community-utils";

interface CommunityThreadProps {
  postId: string;
  initialComments: CommentWithUser[];
}

export function CommunityThread({ postId, initialComments }: CommunityThreadProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitReply = async () => {
    const nextBody = body.trim();
    if (!nextBody || posting) return;

    setPosting(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Sign in to reply.");
        return;
      }

      const { data, error } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          parent_type: "article",
          parent_id: postId,
          body: nextBody,
          is_spoiler: spoiler,
          reply_to: null,
        })
        .select("*, profiles(username, display_name, avatar_url, is_verified)")
        .single();

      if (error) throw error;

      setComments((current) => [...current, data as CommentWithUser]);
      setBody("");
      setSpoiler(false);
      router.refresh();
    } catch {
      setMessage("Could not publish that reply yet.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="community-thread">
      <div className="discussion-composer">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Reply to the thread"
        />
        <div className="discussion-actions">
          <label>
            <input type="checkbox" checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} />
            Spoiler
          </label>
          <button type="button" onClick={submitReply} disabled={posting || !body.trim()} className="shader-button jelly-button">
            <Send size={15} />
            {posting ? "Replying..." : "Reply"}
          </button>
        </div>
        {message ? <p className="community-message">{message}</p> : null}
      </div>

      <div className="comment-stack">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const name = displayUser(comment.profiles);
            return (
              <article key={comment.id} className="comment-card">
                <div className="community-avatar is-small" aria-hidden="true">
                  {comment.profiles.avatar_url ? (
                    <Image src={comment.profiles.avatar_url} alt="" fill sizes="34px" />
                  ) : (
                    <span>{initials(name)}</span>
                  )}
                </div>
                <div>
                  <div className="review-meta">
                    <strong>{name}</strong>
                    <span>{relativeDate(comment.created_at)}</span>
                    {comment.is_spoiler ? <em><ShieldAlert size={13} /> spoiler</em> : null}
                  </div>
                  <p>{comment.body}</p>
                </div>
              </article>
            );
          })
        ) : (
          <div className="community-empty is-compact">
            <p>No replies yet. Be first with a take that is actually useful.</p>
          </div>
        )}
      </div>
    </section>
  );
}

