"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { communityFlairs, slugifyPostTitle, type CommunityFlair } from "./community-utils";

function randomSuffix() {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function CommunityComposer() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [flair, setFlair] = useState<CommunityFlair>("general");
  const [spoiler, setSpoiler] = useState(false);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => title.trim().length >= 4 && body.trim().length >= 1 && !posting, [body, posting, title]);

  const submitPost = async () => {
    if (!canSubmit) return;
    setPosting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Sign in to create a community post.");
        return;
      }

      const postSlug = `${slugifyPostTitle(title)}-${randomSuffix()}`;
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: user.id,
          anime_id: null,
          title: title.trim(),
          slug: postSlug,
          body: body.trim(),
          flair,
          is_spoiler: spoiler,
        })
        .select("slug")
        .single();

      if (error) throw error;

      setTitle("");
      setBody("");
      setSpoiler(false);
      router.push(`/community/${data.slug}`);
      router.refresh();
    } catch {
      setMessage("Could not publish that post yet. Try again in a moment.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="community-composer-card" aria-label="Create a community post">
      <div className="community-composer-title">
        <Sparkles size={16} />
        <span>Start a thread</span>
      </div>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={160}
        placeholder="Ask, recommend, debate, or share a theory"
      />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={8000}
        rows={5}
        placeholder="Write like you are opening a clean subreddit thread. Be specific, mark spoilers, and give people something to respond to."
      />
      <div className="community-composer-controls">
        <select value={flair} onChange={(event) => setFlair(event.target.value as CommunityFlair)} aria-label="Thread flair">
          {communityFlairs.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <label>
          <input type="checkbox" checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} />
          Spoilers
        </label>
        <button type="button" className="shader-button jelly-button" onClick={submitPost} disabled={!canSubmit}>
          <Send size={15} />
          {posting ? "Posting..." : "Post"}
        </button>
      </div>
      {message ? <p className="community-message">{message}</p> : null}
    </section>
  );
}

