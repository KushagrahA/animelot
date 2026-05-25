"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, CirclePlay, Clock3, PauseCircle, PenLine, Plus, Save, XCircle } from "lucide-react";
import { HankoStamp } from "./HankoStamp";
import type { AnimeSeedPayload } from "@/lib/anime/seed";

interface AnimeInteractionPanelProps {
  animeId: string;
  animeSeed: AnimeSeedPayload;
  animeSlug: string;
  animeTitle: string;
  episodeCount: number | null;
  communityScore: number | null;
}

const watchStatuses = [
  { value: "watching", label: "Watching", icon: CirclePlay },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
  { value: "plan_to_watch", label: "Plan", icon: Clock3 },
  { value: "on_hold", label: "Paused", icon: PauseCircle },
  { value: "dropped", label: "Dropped", icon: XCircle },
] as const;

type WatchStatus = (typeof watchStatuses)[number]["value"];

interface StoredInteraction {
  score: number | null;
  status: WatchStatus;
  headline: string;
  review: string;
  episodeScope: number | "";
  containsSpoilers: boolean;
}

const defaultInteraction: StoredInteraction = {
  score: null,
  status: "plan_to_watch",
  headline: "",
  review: "",
  episodeScope: "",
  containsSpoilers: false,
};

function readStoredInteraction(storageKey: string): StoredInteraction {
  if (typeof window === "undefined") return defaultInteraction;

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return defaultInteraction;
    const parsed = JSON.parse(saved) as Partial<StoredInteraction>;
    return {
      score: parsed.score ?? null,
      status: parsed.status ?? "plan_to_watch",
      headline: parsed.headline ?? "",
      review: parsed.review ?? "",
      episodeScope: parsed.episodeScope ?? "",
      containsSpoilers: Boolean(parsed.containsSpoilers),
    };
  } catch {
    return defaultInteraction;
  }
}

export function AnimeInteractionPanel({
  animeId,
  animeSeed,
  animeSlug,
  animeTitle,
  episodeCount,
  communityScore,
}: AnimeInteractionPanelProps) {
  const router = useRouter();
  const storageKey = `animelot:${animeSlug}:interaction`;
  const [score, setScore] = useState<number | null>(() => readStoredInteraction(storageKey).score);
  const [status, setStatus] = useState<WatchStatus>(() => readStoredInteraction(storageKey).status);
  const [headline, setHeadline] = useState(() => readStoredInteraction(storageKey).headline);
  const [review, setReview] = useState(() => readStoredInteraction(storageKey).review);
  const [reviewOpen, setReviewOpen] = useState(() => {
    const stored = readStoredInteraction(storageKey);
    return Boolean(stored.review || stored.headline);
  });
  const [episodeScope, setEpisodeScope] = useState<number | "">(() => readStoredInteraction(storageKey).episodeScope);
  const [containsSpoilers, setContainsSpoilers] = useState(() => readStoredInteraction(storageKey).containsSpoilers);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sliding, setSliding] = useState(false);
  const [pandaBonk, setPandaBonk] = useState(false);
  const [syncedAnimeId, setSyncedAnimeId] = useState(animeId);

  const displayedScore = score ?? communityScore;
  const sliderValue = score ?? communityScore ?? 7;
  const sliderPercent = ((sliderValue - 0.5) / 9.5) * 100;
  const pandaRoll = Math.round(sliderPercent * 5.4);

  const persistLocal = (nextScore = score, nextStatus = status) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        score: nextScore,
        status: nextStatus,
        headline,
        review,
        episodeScope,
        containsSpoilers,
      })
    );
  };

  const saveInteraction = async (nextScore = score, nextStatus = status) => {
    setSaving(true);
    setMessage(null);
    persistLocal(nextScore, nextStatus);

    try {
      const response = await fetch("/api/anime/interaction", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          animeId: syncedAnimeId,
          animeSeed,
          score: nextScore,
          status: nextStatus,
          headline: reviewOpen ? headline : "",
          review: reviewOpen ? review : "",
          episodeScope: episodeScope === "" ? null : episodeScope,
          containsSpoilers,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { animeId?: string; message?: string; error?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "Saved locally. Sign in to publish this rating online.");
        return;
      }

      if (payload.animeId) setSyncedAnimeId(payload.animeId);
      setMessage(payload.message ?? (nextScore != null ? "Rating published to Animelot." : "Saved to your Animelot account."));
      window.setTimeout(() => router.refresh(), 450);
    } catch {
      setMessage("Saved on this device. Could not reach account sync yet.");
    } finally {
      setSaving(false);
    }
  };

  const updateScore = (value: number) => {
    setScore(value);
    void saveInteraction(value, status);
  };

  const updateDraftScore = (value: number) => {
    if (value >= 10 && sliderValue < 10) {
      setPandaBonk(true);
      window.setTimeout(() => setPandaBonk(false), 1200);
    }
    setScore(value);
  };

  const updateStatus = (value: WatchStatus) => {
    setStatus(value);
    void saveInteraction(score, value);
  };

  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-6)",
        marginBottom: "var(--space-8)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
        <HankoStamp score={displayedScore} id={syncedAnimeId} size="md" animate={false} />
        <div>
          <p style={{ fontFamily: "var(--font-data)", fontSize: "var(--text-2xl)", fontWeight: 800, lineHeight: 1 }}>
            {displayedScore ? displayedScore.toFixed(1) : "--"}
          </p>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", marginTop: 2 }}>
            {score == null ? "Community Score" : "Your Score"}
          </p>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="rating-slider-shell">
            <div className="rating-slider-head">
              <p>Rate {animeTitle}</p>
              <strong>{sliderValue.toFixed(1)}</strong>
            </div>
            <div
              className={`rating-slider-wrap ${sliding ? "is-sliding" : ""} ${pandaBonk ? "is-panda-bonk" : ""}`}
              style={{ "--rating-progress": `${sliderPercent}%`, "--panda-roll": `${pandaRoll}deg` } as CSSProperties}
            >
              <div className="rating-wall" aria-hidden="true" />
              <input
                aria-label={`Rate ${animeTitle}`}
                className="rating-slider"
                type="range"
                min={0.5}
                max={10}
                step={0.5}
                value={sliderValue}
                onPointerDown={() => setSliding(true)}
                onInput={(event) => updateDraftScore(Number(event.currentTarget.value))}
                onChange={(event) => updateDraftScore(Number(event.currentTarget.value))}
                onPointerUp={(event) => {
                  setSliding(false);
                  updateScore(Number(event.currentTarget.value));
                }}
                onPointerCancel={() => setSliding(false)}
                onKeyUp={(event) => {
                  if (["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "].includes(event.key)) {
                    updateScore(Number(event.currentTarget.value));
                  }
                }}
                onBlur={(event) => {
                  if (score != null) updateScore(Number(event.currentTarget.value));
                }}
              />
              <div className="rating-panda" style={{ left: `${sliderPercent}%` }} aria-hidden="true" />
              <div className="rating-slider-bubble" style={{ left: `${sliderPercent}%` }}>
                {sliderValue.toFixed(1)}
              </div>
            </div>
            <div className="rating-slider-scale" aria-hidden="true">
              <span>0.5</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-5)" }}>
        {watchStatuses.map((item) => {
          const Icon = item.icon;
          const active = status === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => updateStatus(item.value)}
              className={`watch-status-pill ${active ? "is-active" : ""}`}
            >
              <span className="watch-status-icon">
                {active ? <Check size={13} /> : <Icon size={15} />}
              </span>
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setReviewOpen((open) => !open)}
          className="jelly-button"
          style={{
            height: 36,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "0 var(--space-3)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-full)",
            background: "var(--surface)",
            color: "var(--bloodstone)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          <PenLine size={14} />
          {reviewOpen ? "Hide review" : "Write review"}
        </button>
      </div>

      {reviewOpen ? (
        <div style={{ display: "grid", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
          <input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            maxLength={120}
            placeholder="Headline, optional"
            style={{
              height: 42,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              background: "var(--bg)",
              color: "var(--text)",
              padding: "0 var(--space-3)",
              fontFamily: "var(--font-body)",
              outline: 0,
            }}
          />
          <textarea
            value={review}
            onChange={(event) => setReview(event.target.value)}
            placeholder="What stayed with you?"
            rows={5}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              background: "var(--bg)",
              color: "var(--text)",
              padding: "var(--space-3)",
              fontFamily: "var(--font-body)",
              resize: "vertical",
              outline: 0,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)" }}>
              Reviewed through episode
              <input
                value={episodeScope}
                onChange={(event) => {
                  const value = event.target.value;
                  setEpisodeScope(value === "" ? "" : Math.min(Number(value), episodeCount ?? Number(value)));
                }}
                min={0}
                max={episodeCount ?? undefined}
                type="number"
                style={{
                  width: 78,
                  height: 34,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg)",
                  padding: "0 var(--space-2)",
                  fontFamily: "var(--font-data)",
                }}
              />
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)" }}>
              <input
                checked={containsSpoilers}
                onChange={(event) => setContainsSpoilers(event.target.checked)}
                type="checkbox"
                style={{ accentColor: "var(--bloodstone)" }}
              />
              Contains spoilers
            </label>
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap", marginTop: "var(--space-5)" }}>
        <button
          type="button"
          onClick={() => void saveInteraction()}
          disabled={saving}
          className="jelly-button shader-button"
          style={{
            height: 42,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: 0,
            borderRadius: "var(--radius-md)",
            padding: "0 var(--space-4)",
            color: "var(--accent-contrast)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            fontWeight: 800,
            cursor: saving ? "wait" : "pointer",
          }}
        >
          {reviewOpen ? <Save size={15} /> : <Plus size={15} />}
          {saving ? "Saving..." : score != null ? "Publish rating" : reviewOpen ? "Save rating + review" : "Save to list"}
        </button>
        {message ? (
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)" }}>
            {message}
          </p>
        ) : null}
      </div>

      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", marginTop: "var(--space-3)" }}>
        Your list, rating, and review stay available on this device. Signed-in publishing updates the public Animelot score and review feed.
      </p>
    </section>
  );
}
