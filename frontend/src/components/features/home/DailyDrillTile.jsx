"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, X } from "lucide-react";
import {
  getPublicDailyDrill,
  submitPublicDrillAnswer,
} from "@/services/dailyDrillService";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import DrillSignupModal from "./DrillSignupModal";

// One free drill a visitor can actually play, from the real published bank.
//
// The tile is one cell of a bento row, and the two tiles beside it stretch to
// whatever height this one takes. So its panel is built to be the *same
// height answered as unanswered*: the options never move, and the line above
// them swaps from the scenario to the verdict rather than a result block
// being appended underneath. The explanation itself lives in the modal, which
// is where the visitor is going next anyway.
//
// The courtesy limit is remembered in this browser, not on the server: a guest
// has no account to attach an attempt to, the grading endpoint writes nothing,
// and there is no entitlement here worth defending — clearing site data just
// gets somebody another scenario they could have read anyway. What the server
// does protect is the answer key, which never travels with the question.
const STORAGE_PREFIX = "ttl:homeDrill:";
// Long enough to read your own result before the modal arrives over it.
const SIGNUP_PROMPT_DELAY_MS = 1600;

function readPlayedDate() {
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}date`);
  } catch {
    return null;
  }
}

function writePlayedDate(drillDate) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}date`, drillDate);
  } catch {
    /* Private browsing, or storage switched off — the drill still works. */
  }
}

function OptionRow({ option, state, disabled, onPick }) {
  const TONES = {
    idle: "border-cn-rule bg-white hover:border-cn-accent-soft",
    best: "border-cn-ok bg-cn-ok-bg",
    missed: "border-cn-live bg-[#fdecec]",
    muted: "border-cn-rule bg-white opacity-55",
  };
  const KEY_TONES = {
    idle: "bg-cn-paper-2 text-cn-ink",
    best: "bg-cn-ok text-white",
    missed: "bg-cn-live text-white",
    muted: "bg-cn-paper-2 text-cn-ink",
  };

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-label={`Option ${option.key}: ${option.text}`}
      className={`flex w-full items-center gap-3 rounded-cn-sm border-[1.5px] p-3 text-left text-cn-sm transition-[border-color,background-color] duration-[400ms] disabled:cursor-default ${TONES[state]}`}
    >
      <span
        className={`grid h-[26px] w-[26px] flex-none place-items-center rounded-lg text-cn-xs font-bold ${KEY_TONES[state]}`}
      >
        {state === "best" ? (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        ) : state === "missed" ? (
          <X className="h-3.5 w-3.5" strokeWidth={3} />
        ) : (
          option.key
        )}
      </span>
      <span className="line-clamp-2 min-w-0 flex-1 text-cn-ink">
        {option.text}
      </span>
    </button>
  );
}

export default function DailyDrillTile({ className = "" }) {
  // `status` is "loading" until AuthProvider has settled the session. Until
  // then nobody knows whether this is a member, so the tile shows neither
  // variant — and, more usefully, doesn't fetch a taster drill a member will
  // never be shown.
  const { isAuthenticated, status: authStatus } = useAuth();
  const isAuthResolved = authStatus !== "loading";
  const [result, setResult] = useState(null);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const promptTimerRef = useRef(null);

  const drillQuery = useQuery({
    queryKey: ["public-daily-drill"],
    queryFn: async () => (await getPublicDailyDrill())?.data || null,
    // A signed-in member plays the real drill in the portal, where it counts.
    enabled: isAuthResolved && !isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const drill = drillQuery.data;
  const drillDate = drill?.drill_date;

  // Read the courtesy limit after mount rather than during render, so the
  // server and the first client pass agree on what the tile looks like.
  useEffect(() => {
    if (!drillDate) return;
    setHasPlayedToday(readPlayedDate() === drillDate);
  }, [drillDate]);

  useEffect(() => () => clearTimeout(promptTimerRef.current), []);

  const gradeMutation = useMutation({
    mutationFn: async (answerKey) =>
      (await submitPublicDrillAnswer(answerKey))?.data || null,
    onSuccess: (data) => {
      setResult(data);
      if (drillDate) writePlayedDate(drillDate);
      setHasPlayedToday(true);
      promptTimerRef.current = setTimeout(
        () => setIsSignupOpen(true),
        SIGNUP_PROMPT_DELAY_MS,
      );
    },
  });

  function handlePick(answerKey) {
    // The second attempt of the day is the gate, not another drill.
    if (hasPlayedToday || result) {
      setIsSignupOpen(true);
      return;
    }
    gradeMutation.mutate(answerKey);
  }

  function optionState(option) {
    if (!result) return "idle";
    if (option.key === result.best.key) return "best";
    if (option.key === result.selected.key) return "missed";
    return "muted";
  }

  return (
    <>
      <article data-cn-reveal className={`cn-reveal ${className}`}>
        <h3 className="text-cn-xl font-bold tracking-[-0.015em] text-cn-ink">
          A drill every morning
        </h3>
        <p className="max-w-[42ch] text-cn-ink-2">
          One real dilemma a day, with the best move explained.
        </p>

        {!isAuthResolved || (!isAuthenticated && drillQuery.isLoading) ? (
          <div
            aria-busy="true"
            className="mt-auto grid gap-3 rounded-cn bg-cn-paper-2 p-4"
          >
            <span className="h-3 w-full animate-pulse rounded bg-cn-paper-4" />
            <span className="h-3 w-4/5 animate-pulse rounded bg-cn-paper-4" />
            {[0, 1, 2].map((row) => (
              <span
                key={row}
                className="h-[50px] animate-pulse rounded-cn-sm bg-white"
              />
            ))}
          </div>
        ) : isAuthenticated ? (
          <div className="mt-auto grid gap-3 rounded-cn bg-cn-paper-2 p-4">
            <p className="text-cn-sm text-cn-ink-2">
              Today&apos;s drill is waiting in your portal, where it counts
              towards your streak and your points.
            </p>
            <Link
              href={`${ROUTES.STUDENT_PORTAL}/drill`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-4 text-cn-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2"
            >
              Open today&apos;s drill
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : !drill?.available ? (
          <div className="mt-auto grid gap-3 rounded-cn bg-cn-paper-2 p-4">
            <p className="text-cn-sm text-cn-ink-2">
              The next drill is being written. Create an account and it will be
              waiting for you in the morning.
            </p>
            <button
              type="button"
              onClick={() => setIsSignupOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-4 text-cn-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2"
            >
              Create a free account
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-auto grid gap-3 rounded-cn bg-cn-paper-2 p-4">
            {/* Two lines' worth of space, whatever is in it: the scenario
                before an answer, the verdict after one, the gate on a
                return visit. Holding the height here is what keeps the
                tiles either side of this one from stretching. */}
            <div className="grid min-h-[44px] content-start">
              {gradeMutation.isError ? (
                <p className="text-cn-sm text-cn-live">
                  That didn&apos;t go through. Pick an option to try again.
                </p>
              ) : result ? (
                <>
                  <b
                    className={`text-cn-sm font-bold ${
                      result.is_best ? "text-cn-ok" : "text-cn-ink"
                    }`}
                  >
                    {result.is_best
                      ? "Best move."
                      : `Option ${result.best.key} was the strongest move.`}
                  </b>
                  <button
                    type="button"
                    onClick={() => setIsSignupOpen(true)}
                    className="justify-self-start text-cn-sm font-semibold text-cn-accent hover:underline"
                  >
                    See why, and get tomorrow&apos;s →
                  </button>
                </>
              ) : hasPlayedToday ? (
                <>
                  <b className="text-cn-sm font-bold text-cn-ink">
                    You&apos;ve taken today&apos;s free drill.
                  </b>
                  <button
                    type="button"
                    onClick={() => setIsSignupOpen(true)}
                    className="justify-self-start text-cn-sm font-semibold text-cn-accent hover:underline"
                  >
                    See what an account gets you →
                  </button>
                </>
              ) : (
                <p className="line-clamp-2 text-cn-sm text-cn-ink-2">
                  {drill.scenario}
                </p>
              )}
            </div>

            {drill.options.map((option) => (
              <OptionRow
                key={option.key}
                option={option}
                state={optionState(option)}
                disabled={gradeMutation.isPending}
                onPick={() => handlePick(option.key)}
              />
            ))}
          </div>
        )}
      </article>

      <DrillSignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        result={result}
      />
    </>
  );
}
