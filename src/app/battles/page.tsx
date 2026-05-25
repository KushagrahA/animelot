"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Globe2, Heart, Mars, ShieldAlert, Sparkles, UsersRound, Venus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface WorldChoice {
  id: string;
  title: string;
  world: string;
  image: string;
  upside: string;
  catch: string;
  vibe: string;
  baseVotes: number;
  color: string;
}

interface WorldPrompt {
  id: string;
  question: string;
  left: WorldChoice;
  right: WorldChoice;
}

interface DateChoice {
  id: string;
  name: string;
  anime: string;
  image: string;
  gender: "male" | "female" | "unknown";
  trait: string;
  baseVotes: number;
  color: string;
}

interface DatePrompt {
  id: string;
  left: DateChoice;
  right: DateChoice;
}

interface AniListCharacter {
  id: number;
  name: { full: string | null };
  gender: string | null;
  image: { large: string | null };
  media: {
    nodes: {
      title: { english: string | null; romaji: string };
    }[];
  };
}

const prompts: WorldPrompt[] = [
  {
    id: "grand-line-vs-hidden-leaf",
    question: "Would you rather wake up in the Grand Line or the Hidden Leaf?",
    left: {
      id: "one-piece",
      title: "ONE PIECE",
      world: "The Grand Line",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
      upside: "Freedom, found family, treasure maps, and islands that feel impossible.",
      catch: "Sea monsters, tyrants, and a very real chance of getting launched through a wall.",
      vibe: "chaotic freedom",
      baseVotes: 879,
      color: "#1C9ED6",
    },
    right: {
      id: "naruto",
      title: "Naruto",
      world: "Hidden Leaf Village",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-YJvLbgJQPCoI.jpg",
      upside: "Ninja training, ramen after missions, and a village that can become home.",
      catch: "Exams are dangerous, politics are messy, and every mentor has a tragic backstory.",
      vibe: "bonded ambition",
      baseVotes: 743,
      color: "#E5753A",
    },
  },
  {
    id: "jujutsu-vs-demon-slayer",
    question: "Would you rather fight curses in Tokyo or demons by moonlight?",
    left: {
      id: "jujutsu-kaisen",
      title: "JUJUTSU KAISEN",
      world: "Tokyo Jujutsu High",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx124194-TJlqMMR7BGn9.jpg",
      upside: "Sharp mentors, cursed technique potential, and elite team chaos.",
      catch: "The threat level is absurd and nobody gets enough recovery time.",
      vibe: "stylish danger",
      baseVotes: 612,
      color: "#7A1220",
    },
    right: {
      id: "demon-slayer",
      title: "Demon Slayer",
      world: "Demon Slayer Corps",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
      upside: "Breathing styles, mountain training, and a world with deep courage.",
      catch: "Night travel is a problem, and every mission asks too much of your heart.",
      vibe: "tender bravery",
      baseVotes: 704,
      color: "#244B7A",
    },
  },
  {
    id: "amestris-vs-death-note",
    question: "Would you rather live with alchemy or in Kira-era Tokyo?",
    left: {
      id: "fullmetal",
      title: "Fullmetal Alchemist",
      world: "Amestris",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-nSWCgQlmOMtj.jpg",
      upside: "Alchemy, engineering, great coats, and knowledge with real weight.",
      catch: "Equivalent exchange is not a slogan. It is a warning label.",
      vibe: "earned wisdom",
      baseVotes: 951,
      color: "#C48634",
    },
    right: {
      id: "death-note",
      title: "Death Note",
      world: "Kira-era Tokyo",
      image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg",
      upside: "Modern comforts, mind games, and the chance to stay very anonymous.",
      catch: "One bored genius can make the entire world feel unsafe.",
      vibe: "paranoid chess",
      baseVotes: 388,
      color: "#2D3142",
    },
  },
];

const fallbackDates: DateChoice[] = [
  {
    id: "fallback-marin",
    name: "Marin Kitagawa",
    anime: "My Dress-Up Darling",
    gender: "female",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx132405-qP7FQYGmNI3d.jpg",
    trait: "sunny chaos",
    baseVotes: 914,
    color: "#B71D32",
  },
  {
    id: "fallback-gojo",
    name: "Satoru Gojo",
    anime: "JUJUTSU KAISEN",
    gender: "male",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-979HcAGIwkO5.jpg",
    trait: "dangerously confident",
    baseVotes: 881,
    color: "#244B7A",
  },
  {
    id: "fallback-violet",
    name: "Violet Evergarden",
    anime: "Violet Evergarden",
    gender: "female",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21827-10F6m50H4GJK.png",
    trait: "quiet devotion",
    baseVotes: 744,
    color: "#6A8880",
  },
  {
    id: "fallback-levi",
    name: "Levi Ackerman",
    anime: "Attack on Titan",
    gender: "male",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg",
    trait: "sharp discipline",
    baseVotes: 819,
    color: "#201C18",
  },
];

type GameMode = "worlds" | "date";
type DateGender = "all" | "male" | "female";
type MatchVoteMode = "worlds" | "date";
type VoteCounts = Record<string, Record<string, number>>;

function readVotes(key: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function persistVotes(key: string, votes: Record<string, string>) {
  window.localStorage.setItem(key, JSON.stringify(votes));
}

function getVoterKey() {
  if (typeof window === "undefined") return "";
  const key = "animelot:match-voter";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(key, next);
  return next;
}

function tallyChoices(rows: { choice_id: string }[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.choice_id] = (acc[row.choice_id] ?? 0) + 1;
    return acc;
  }, {});
}

async function loadSharedVoteCounts(mode: MatchVoteMode, matchupId: string) {
  const supabase = createClient();
  const { data } = await supabase.from("match_votes").select("choice_id").eq("mode", mode).eq("matchup_id", matchupId).limit(5000);
  return tallyChoices(data ?? []);
}

async function persistSharedVote(mode: MatchVoteMode, matchupId: string, choiceId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("match_votes").upsert(
    {
      mode,
      matchup_id: matchupId,
      choice_id: choiceId,
      voter_key: getVoterKey(),
      user_id: user?.id ?? null,
    },
    { onConflict: "mode,matchup_id,voter_key" }
  );
}

function getWorldVotes(prompt: WorldPrompt, sharedCounts: Record<string, number> | undefined) {
  const leftVotes = prompt.left.baseVotes + (sharedCounts?.[prompt.left.id] ?? 0);
  const rightVotes = prompt.right.baseVotes + (sharedCounts?.[prompt.right.id] ?? 0);
  const total = leftVotes + rightVotes;
  return {
    leftVotes,
    rightVotes,
    total,
    leftPct: Math.round((leftVotes / total) * 100),
    rightPct: Math.round((rightVotes / total) * 100),
  };
}

function getDateVotes(prompt: DatePrompt, sharedCounts: Record<string, number> | undefined) {
  const leftVotes = prompt.left.baseVotes + (sharedCounts?.[prompt.left.id] ?? 0);
  const rightVotes = prompt.right.baseVotes + (sharedCounts?.[prompt.right.id] ?? 0);
  const total = leftVotes + rightVotes;
  return {
    leftVotes,
    rightVotes,
    leftPct: Math.round((leftVotes / total) * 100),
    rightPct: Math.round((rightVotes / total) * 100),
  };
}

function mapGender(value: string | null): DateChoice["gender"] {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("male") && !normalized.includes("female")) return "male";
  if (normalized.includes("female")) return "female";
  return "unknown";
}

function traitFor(id: number) {
  const traits = ["main character energy", "soft chaos", "deadpan charm", "dangerous smile", "gentle loyalty", "dramatic sparkle"];
  return traits[id % traits.length];
}

function colorFor(id: number) {
  const colors = ["#7A1220", "#244B7A", "#6A8880", "#B15F3A", "#201C18", "#8A2940"];
  return colors[id % colors.length];
}

function WorldPanel({
  choice,
  active,
  dimmed,
  revealed,
  percentage,
  votes,
  onVote,
}: {
  choice: WorldChoice;
  active: boolean;
  dimmed: boolean;
  revealed: boolean;
  percentage: number;
  votes: number;
  onVote: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={`world-choice-${choice.id}`}
      onClick={onVote}
      className={`world-choice-card world-panel ${active ? "is-active" : ""} ${dimmed ? "is-dimmed" : ""}`}
      style={{ background: choice.color }}
    >
      <span style={{ position: "absolute", inset: 0 }}>
        <Image src={choice.image} alt="" fill priority sizes="(max-width: 800px) 100vw, 50vw" className="object-cover" />
      </span>
      <span className="world-panel-shade" />
      <span className="world-panel-color" style={{ background: `radial-gradient(circle at 18% 18%, ${choice.color}AA, transparent 34%)` }} />

      <span className="world-panel-top">
        <span className="world-chip">
          <Globe2 size={14} />
          {choice.vibe}
        </span>
        {revealed ? <span className="world-percent-mini">{percentage}%</span> : null}
      </span>

      <span className="world-panel-copy">
        <span className="world-name">{choice.world}</span>
        <span className="world-title">{choice.title}</span>
        <span className="world-detail">
          <span>
            <Sparkles size={16} />
            {choice.upside}
          </span>
          <span>
            <ShieldAlert size={16} />
            {choice.catch}
          </span>
        </span>
        {revealed ? (
          <span className="world-result-line">
            <span>
              {votes.toLocaleString()} votes {active ? " - your pick" : ""}
            </span>
            <span className="world-result-track">
              <span style={{ width: `${percentage}%` }} />
            </span>
          </span>
        ) : (
          <span className="world-pick-hint">Tap to choose this world</span>
        )}
      </span>
    </button>
  );
}

function DatePanel({
  choice,
  active,
  dimmed,
  revealed,
  percentage,
  votes,
  onVote,
}: {
  choice: DateChoice;
  active: boolean;
  dimmed: boolean;
  revealed: boolean;
  percentage: number;
  votes: number;
  onVote: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onVote}
      className={`world-choice-card date-panel ${active ? "is-active" : ""} ${dimmed ? "is-dimmed" : ""}`}
      style={{ background: choice.color }}
    >
      <span style={{ position: "absolute", inset: 0 }}>
        <Image src={choice.image} alt="" fill sizes="(max-width: 800px) 100vw, 50vw" className="object-cover" />
      </span>
      <span className="world-panel-shade" />
      <span className="world-panel-color" style={{ background: `radial-gradient(circle at 18% 18%, ${choice.color}B8, transparent 34%)` }} />
      <span className="world-panel-top">
        <span className="world-chip">
          <Heart size={14} />
          {choice.trait}
        </span>
        {revealed ? <span className="world-percent-mini">{percentage}%</span> : null}
      </span>
      <span className="world-panel-copy">
        <span className="world-name">{choice.anime}</span>
        <span className="world-title">{choice.name}</span>
        <span className="world-detail">
          <span>
            <Sparkles size={16} />
            Pick the character you would rather date.
          </span>
          <span>
            {choice.gender === "female" ? <Venus size={16} /> : <Mars size={16} />}
            {choice.gender === "unknown" ? "Anime character" : choice.gender === "female" ? "Female character" : "Male character"}
          </span>
        </span>
        {revealed ? (
          <span className="world-result-line">
            <span>
              {votes.toLocaleString()} votes {active ? " - your pick" : ""}
            </span>
            <span className="world-result-track">
              <span style={{ width: `${percentage}%` }} />
            </span>
          </span>
        ) : (
          <span className="world-pick-hint">Tap to choose this date</span>
        )}
      </span>
    </button>
  );
}

export default function BattlesPage() {
  const [mode, setMode] = useState<GameMode>("worlds");
  const [promptIndex, setPromptIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, string>>(() => readVotes("animelot:world-votes"));
  const [freshReveal, setFreshReveal] = useState<{ promptId: string; choiceId: string } | null>(null);
  const [worldVoteCounts, setWorldVoteCounts] = useState<VoteCounts>({});
  const [characters, setCharacters] = useState<DateChoice[]>(fallbackDates);
  const [dateGender, setDateGender] = useState<DateGender>("all");
  const [dateIndex, setDateIndex] = useState(0);
  const [dateVotes, setDateVotes] = useState<Record<string, string>>(() => readVotes("animelot:date-votes"));
  const [freshDateReveal, setFreshDateReveal] = useState<{ promptId: string; choiceId: string } | null>(null);
  const [dateVoteCounts, setDateVoteCounts] = useState<VoteCounts>({});

  const prompt = prompts[promptIndex];
  const selectedId = votes[prompt.id];
  const revealed = Boolean(selectedId);
  const stats = useMemo(() => getWorldVotes(prompt, worldVoteCounts[prompt.id]), [prompt, worldVoteCounts]);
  const selectedChoice = selectedId === prompt.left.id ? prompt.left : selectedId === prompt.right.id ? prompt.right : null;
  const selectedPct = selectedId === prompt.left.id ? stats.leftPct : selectedId === prompt.right.id ? stats.rightPct : 0;
  const showReveal = freshReveal?.promptId === prompt.id;

  const datePool = useMemo(() => {
    const filtered = characters.filter((character) => dateGender === "all" || character.gender === dateGender);
    return filtered.length >= 2 ? filtered : characters;
  }, [characters, dateGender]);

  const datePrompt = useMemo<DatePrompt>(() => {
    const left = datePool[dateIndex % datePool.length] ?? fallbackDates[0];
    const right = datePool[(dateIndex + 1) % datePool.length] ?? fallbackDates[1];
    return { id: `${left.id}-vs-${right.id}`, left, right };
  }, [dateIndex, datePool]);

  const selectedDateId = dateVotes[datePrompt.id];
  const dateRevealed = Boolean(selectedDateId);
  const dateStats = useMemo(() => getDateVotes(datePrompt, dateVoteCounts[datePrompt.id]), [datePrompt, dateVoteCounts]);
  const selectedDate = selectedDateId === datePrompt.left.id ? datePrompt.left : selectedDateId === datePrompt.right.id ? datePrompt.right : null;
  const selectedDatePct = selectedDateId === datePrompt.left.id ? dateStats.leftPct : selectedDateId === datePrompt.right.id ? dateStats.rightPct : 0;
  const showDateReveal = freshDateReveal?.promptId === datePrompt.id;

  const nextPrompt = useCallback(() => {
    setFreshReveal(null);
    setPromptIndex((index) => (index + 1) % prompts.length);
  }, []);

  const nextDatePrompt = useCallback(() => {
    setFreshDateReveal(null);
    setDateIndex((index) => (index + 2) % Math.max(datePool.length, 2));
  }, [datePool.length]);

  useEffect(() => {
    let cancelled = false;

    async function loadCharacters() {
      try {
        const response = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            query: `
              query DateCharacters {
                Page(page: 1, perPage: 36) {
                  characters(sort: FAVOURITES_DESC) {
                    id
                    name { full }
                    gender
                    image { large }
                    media(type: ANIME, sort: POPULARITY_DESC, perPage: 1) {
                      nodes { title { english romaji } }
                    }
                  }
                }
              }
            `,
          }),
        });
        const payload = (await response.json()) as { data?: { Page?: { characters?: AniListCharacter[] } } };
        const mapped =
          payload.data?.Page?.characters
            ?.filter((character) => character.name.full && character.image.large)
            .map((character) => ({
              id: `character-${character.id}`,
              name: character.name.full ?? "Anime character",
              anime: character.media.nodes[0]?.title.english || character.media.nodes[0]?.title.romaji || "Anime",
              image: character.image.large ?? fallbackDates[0].image,
              gender: mapGender(character.gender),
              trait: traitFor(character.id),
              baseVotes: 420 + (character.id % 820),
              color: colorFor(character.id),
            })) ?? [];

        if (!cancelled && mapped.length >= 8) {
          setCharacters(mapped);
        }
      } catch {
        if (!cancelled) setCharacters(fallbackDates);
      }
    }

    void loadCharacters();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showReveal) return;
    const timeout = window.setTimeout(nextPrompt, 1800);
    return () => window.clearTimeout(timeout);
  }, [nextPrompt, showReveal, prompt.id]);

  useEffect(() => {
    if (!showDateReveal) return;
    const timeout = window.setTimeout(nextDatePrompt, 1700);
    return () => window.clearTimeout(timeout);
  }, [nextDatePrompt, showDateReveal, datePrompt.id, datePool.length]);

  useEffect(() => {
    let cancelled = false;
    loadSharedVoteCounts("worlds", prompt.id)
      .then((counts) => {
        if (!cancelled) setWorldVoteCounts((current) => ({ ...current, [prompt.id]: counts }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [prompt.id]);

  useEffect(() => {
    let cancelled = false;
    loadSharedVoteCounts("date", datePrompt.id)
      .then((counts) => {
        if (!cancelled) setDateVoteCounts((current) => ({ ...current, [datePrompt.id]: counts }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [datePrompt.id]);

  const choose = (choiceId: string) => {
    if (showReveal) {
      nextPrompt();
      return;
    }
    const nextVotes = { ...votes, [prompt.id]: choiceId };
    setVotes(nextVotes);
    setWorldVoteCounts((current) => ({
      ...current,
      [prompt.id]: {
        ...(current[prompt.id] ?? {}),
        [choiceId]: (current[prompt.id]?.[choiceId] ?? 0) + 1,
      },
    }));
    setFreshReveal({ promptId: prompt.id, choiceId });
    persistVotes("animelot:world-votes", nextVotes);
    void persistSharedVote("worlds", prompt.id, choiceId)
      .then(() => loadSharedVoteCounts("worlds", prompt.id))
      .then((counts) => setWorldVoteCounts((current) => ({ ...current, [prompt.id]: counts })))
      .catch(() => undefined);
  };

  const chooseDate = (choiceId: string) => {
    if (showDateReveal) {
      nextDatePrompt();
      return;
    }
    const nextVotes = { ...dateVotes, [datePrompt.id]: choiceId };
    setDateVotes(nextVotes);
    setDateVoteCounts((current) => ({
      ...current,
      [datePrompt.id]: {
        ...(current[datePrompt.id] ?? {}),
        [choiceId]: (current[datePrompt.id]?.[choiceId] ?? 0) + 1,
      },
    }));
    setFreshDateReveal({ promptId: datePrompt.id, choiceId });
    persistVotes("animelot:date-votes", nextVotes);
    void persistSharedVote("date", datePrompt.id, choiceId)
      .then(() => loadSharedVoteCounts("date", datePrompt.id))
      .then((counts) => setDateVoteCounts((current) => ({ ...current, [datePrompt.id]: counts })))
      .catch(() => undefined);
  };

  const changeGender = (nextGender: DateGender) => {
    setDateGender(nextGender);
    setDateIndex(0);
    setFreshDateReveal(null);
  };

  return (
    <div className="world-game-stage">
      <div className="world-game-header">
        <div className="world-header-left">
          <span className="world-round">
            <UsersRound size={15} />
            {mode === "worlds" ? `Round ${promptIndex + 1} / ${prompts.length}` : "Date duel"}
          </span>
          <div className="world-mode-tabs" aria-label="World game mode">
            <button type="button" className={mode === "worlds" ? "is-active" : ""} onClick={() => setMode("worlds")}>
              Worlds
            </button>
            <button type="button" className={mode === "date" ? "is-active" : ""} onClick={() => setMode("date")}>
              Who would you date?
            </button>
          </div>
        </div>
        <h1>{mode === "worlds" ? prompt.question : "Who would you date?"}</h1>
        <button type="button" onClick={mode === "worlds" ? nextPrompt : nextDatePrompt} className="world-next-button">
          Skip
          <ArrowRight size={15} />
        </button>
      </div>

      {mode === "date" ? (
        <div className="date-filter-bar" aria-label="Date character filter">
          <button type="button" className={dateGender === "all" ? "is-active" : ""} onClick={() => changeGender("all")}>
            All
          </button>
          <button type="button" className={dateGender === "female" ? "is-active" : ""} onClick={() => changeGender("female")}>
            <Venus size={14} />
            Female
          </button>
          <button type="button" className={dateGender === "male" ? "is-active" : ""} onClick={() => changeGender("male")}>
            <Mars size={14} />
            Male
          </button>
        </div>
      ) : null}

      {mode === "worlds" ? (
        <div className="world-choice-grid">
          <WorldPanel
            choice={prompt.left}
            active={selectedId === prompt.left.id}
            dimmed={revealed && selectedId !== prompt.left.id}
            revealed={revealed}
            percentage={stats.leftPct}
            votes={stats.leftVotes}
            onVote={() => choose(prompt.left.id)}
          />
          <WorldPanel
            choice={prompt.right}
            active={selectedId === prompt.right.id}
            dimmed={revealed && selectedId !== prompt.right.id}
            revealed={revealed}
            percentage={stats.rightPct}
            votes={stats.rightVotes}
            onVote={() => choose(prompt.right.id)}
          />
        </div>
      ) : (
        <div className="world-choice-grid">
          <DatePanel
            choice={datePrompt.left}
            active={selectedDateId === datePrompt.left.id}
            dimmed={dateRevealed && selectedDateId !== datePrompt.left.id}
            revealed={dateRevealed}
            percentage={dateStats.leftPct}
            votes={dateStats.leftVotes}
            onVote={() => chooseDate(datePrompt.left.id)}
          />
          <DatePanel
            choice={datePrompt.right}
            active={selectedDateId === datePrompt.right.id}
            dimmed={dateRevealed && selectedDateId !== datePrompt.right.id}
            revealed={dateRevealed}
            percentage={dateStats.rightPct}
            votes={dateStats.rightVotes}
            onVote={() => chooseDate(datePrompt.right.id)}
          />
        </div>
      )}

      {showReveal && selectedChoice ? (
        <button type="button" className="world-reveal-overlay" aria-live="polite" onClick={nextPrompt}>
          <span className="world-reveal-card">
            <span>You chose</span>
            <strong>{selectedChoice.world}</strong>
            <b>{selectedPct}%</b>
            <em>of players picked this world</em>
            <small>Tap to continue</small>
          </span>
        </button>
      ) : null}

      {showDateReveal && selectedDate ? (
        <button type="button" className="world-reveal-overlay" aria-live="polite" onClick={nextDatePrompt}>
          <span className="world-reveal-card">
            <span>You picked</span>
            <strong>{selectedDate.name}</strong>
            <b>{selectedDatePct}%</b>
            <em>of players chose this character</em>
            <small>Tap for next pair</small>
          </span>
        </button>
      ) : null}
    </div>
  );
}
