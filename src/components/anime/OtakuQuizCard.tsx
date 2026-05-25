"use client";

import { useMemo, useState } from "react";
import { Brain, Check, Sparkles, X } from "lucide-react";

interface OtakuQuizCardProps {
  animeTitle: string;
  genres: string[];
  studios: string[];
  episodes: number | null;
  format: string | null;
  seasonYear: number | null;
}

interface QuizQuestion {
  prompt: string;
  answer: string;
  options: string[];
}

function uniqueOptions(answer: string, options: string[]) {
  return [answer, ...options.filter((option) => option !== answer)].slice(0, 4);
}

function buildQuestions({ animeTitle, genres, studios, episodes, format, seasonYear }: OtakuQuizCardProps): QuizQuestion[] {
  const primaryGenre = genres[0] ?? "Drama";
  const studio = studios[0] ?? "its main studio";
  const formatAnswer = format?.replaceAll("_", " ") ?? "TV";
  const episodeAnswer = episodes ? `${episodes} episodes` : "unknown episode count";
  const yearAnswer = seasonYear ? `${seasonYear}` : "unknown year";

  return [
    {
      prompt: `Which genre is most visibly attached to ${animeTitle}?`,
      answer: primaryGenre,
      options: uniqueOptions(primaryGenre, ["Action", "Romance", "Comedy", "Fantasy", "Mystery"]),
    },
    {
      prompt: `What format is listed for ${animeTitle}?`,
      answer: formatAnswer,
      options: uniqueOptions(formatAnswer, ["TV", "MOVIE", "OVA", "ONA"]),
    },
    {
      prompt: `How many episodes are listed here?`,
      answer: episodeAnswer,
      options: uniqueOptions(episodeAnswer, ["12 episodes", "24 episodes", "1 episode", "64 episodes"]),
    },
    {
      prompt: `Which studio signal appears on this page?`,
      answer: studio,
      options: uniqueOptions(studio, ["MAPPA", "Kyoto Animation", "ufotable", "Bones"]),
    },
    {
      prompt: `What year signal is shown for this anime?`,
      answer: yearAnswer,
      options: uniqueOptions(yearAnswer, ["2009", "2016", "2021", "2026"]),
    },
  ].map((question) => ({
    ...question,
    options: question.options.slice(0, 4),
  }));
}

export function OtakuQuizCard(props: OtakuQuizCardProps) {
  const questions = useMemo(() => buildQuestions(props), [props]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[index];
  const otakuScore = Math.round((correct / questions.length) * 10);

  const answer = (option: string) => {
    const wasCorrect = option === current.answer;
    if (wasCorrect) setCorrect((value) => value + 1);
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
  };

  const reset = () => {
    setIndex(0);
    setCorrect(0);
    setFinished(false);
  };

  return (
    <section className="otaku-quiz-card">
      <div>
        <p className="community-kicker">Challenge</p>
        <h2>How otaku are you?</h2>
        <p>Take a quick quiz from this anime&apos;s own page signals and get an otaku score out of 10.</p>
      </div>
      <button type="button" className="shader-button jelly-button" onClick={() => setOpen(true)}>
        <Brain size={16} />
        Start quiz
      </button>

      {open ? (
        <div className="otaku-modal" role="dialog" aria-modal="true" aria-label={`How otaku are you for ${props.animeTitle}`}>
          <div className="otaku-panel">
            <button type="button" className="otaku-close" aria-label="Close quiz" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
            {!finished ? (
              <>
                <div className="otaku-progress">
                  <span>{index + 1} / {questions.length}</span>
                  <strong>{correct} correct</strong>
                </div>
                <h3>{current.prompt}</h3>
                <div className="otaku-options">
                  {current.options.map((option) => (
                    <button key={option} type="button" onClick={() => answer(option)}>
                      {option}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="otaku-result">
                <Sparkles size={24} />
                <p>Your otakuness</p>
                <strong>{otakuScore}/10</strong>
                <span>
                  {otakuScore >= 8
                    ? "Elite memory. You were paying attention."
                    : otakuScore >= 5
                      ? "Solid fan energy. One rewatch and you level up."
                      : "Fresh watcher aura. The training arc starts now."}
                </span>
                <button type="button" onClick={reset}>
                  <Check size={15} />
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

