"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RotateCcw } from "lucide-react";
import {
  abandonRolePlaySession,
  evaluateRolePlaySession,
  sendRolePlayReply,
  startRolePlaySession,
} from "@/services/wargamerService";
import {
  ROLEPLAY_SESSION_QUERY_KEY,
  useRolePlaySession,
} from "@/hooks/student/useRolePlaySession";
import {
  ROLEPLAY_SCENARIOS_QUERY_KEY,
  useRolePlayScenarios,
} from "@/hooks/student/useRolePlayScenarios";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ModuleIntroPanel from "./ModuleIntroPanel";
import AbpMethodPanel from "./AbpMethodPanel";
import ScenarioPicker from "./ScenarioPicker";
import RolePlayStage from "./RolePlayStage";
import EvaluationReport from "./EvaluationReport";

// Once a student has been through the briefing and the method, dropping them
// back on the intro screen every visit is friction, not teaching — so that is
// remembered per browser, the same way the Daily Drill reminder is.
const INTRO_SEEN_STORAGE_KEY = "ttl:wargamerIntroSeen";

const STEPS = { INTRO: "intro", METHOD: "method", SCENARIOS: "scenarios", SESSION: "session" };

/**
 * The LS-302 module, in the five steps the brief describes: introduction,
 * the A.B.P. method, pick a situation, the live role-play, then the scored
 * report card.
 *
 * Which of the last two is showing is derived from the session's own status
 * rather than stored alongside it — a scored session can only ever render as
 * a report card, so the two can't disagree.
 */
export default function WargamerModule({ initialSessionId = null, onSessionOpened }) {
  const queryClient = useQueryClient();

  const [step, setStep] = useState(STEPS.INTRO);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [startingScenarioId, setStartingScenarioId] = useState(null);
  // A failed reply, handed back to the composer. The token is what makes a
  // second identical failure restore the text again (see RolePlayComposer).
  const [failedReply, setFailedReply] = useState({ text: "", token: 0 });
  const [isQuitOpen, setIsQuitOpen] = useState(false);

  const { data: catalog, isLoading: isLoadingCatalog } = useRolePlayScenarios();
  const { data: session, isLoading: isLoadingSession } = useRolePlaySession(activeSessionId);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY)) setStep(STEPS.SCENARIOS);
    } catch {
      // localStorage unavailable (private browsing, etc.) — fall through and
      // show the intro, which is the safe default rather than a failure.
    }
  }, []);

  // Opening a run from the history table (a sibling section of this tab)
  // hands the id down here rather than duplicating the session view there.
  useEffect(() => {
    if (!initialSessionId) return;
    setActiveSessionId(initialSessionId);
    setStep(STEPS.SESSION);
    onSessionOpened?.();
  }, [initialSessionId, onSessionOpened]);

  const markIntroSeen = useCallback(() => {
    try {
      window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, "1");
    } catch {
      // Nothing to do — the student just sees the intro again next visit.
    }
  }, []);

  const cacheSession = useCallback(
    (updated) => {
      if (!updated?.id) return;
      queryClient.setQueryData([ROLEPLAY_SESSION_QUERY_KEY, updated.id], updated);
    },
    [queryClient],
  );

  const refreshProgress = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ROLEPLAY_SCENARIOS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["roleplay", "history"] });
  }, [queryClient]);

  const startMutation = useMutation({
    mutationFn: (scenarioId) => startRolePlaySession(scenarioId),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }) => sendRolePlayReply(id, message),
  });

  const evaluateMutation = useMutation({
    mutationFn: (id) => evaluateRolePlaySession(id),
  });

  const abandonMutation = useMutation({
    mutationFn: (id) => abandonRolePlaySession(id),
  });

  const handleStart = async (scenario) => {
    setStartingScenarioId(scenario.id);
    setFailedReply({ text: "", token: 0 });
    try {
      const response = await startMutation.mutateAsync(scenario.id);
      const started = response?.data;
      if (started?.id) {
        cacheSession(started);
        setActiveSessionId(started.id);
        setStep(STEPS.SESSION);
      }
      refreshProgress();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to open that situation."));
    } finally {
      setStartingScenarioId(null);
    }
  };

  const handleSend = async (message) => {
    if (!activeSessionId) return;
    try {
      const response = await replyMutation.mutateAsync({ id: activeSessionId, message });
      cacheSession(response?.data?.session);
    } catch (error) {
      // The backend rolls a failed turn back completely, so the student's
      // words are returned to the composer rather than lost.
      setFailedReply((previous) => ({ text: message, token: previous.token + 1 }));
      toastError(getApiErrorMessage(error, "Your reply didn't go through. Try sending it again."));
    }
  };

  const handleFinish = async () => {
    if (!activeSessionId) return;
    try {
      const response = await evaluateMutation.mutateAsync(activeSessionId);
      const scored = response?.data;
      cacheSession(scored);
      refreshProgress();
      // A pass pays into the shared points ledger, so the portal header's
      // balance has to be refetched rather than left showing a stale number.
      queryClient.invalidateQueries({ queryKey: ["daily-drill", "today"] });
      if (scored?.points_awarded > 0) {
        toastSuccess(`Scored ${scored.overall_score}/100 — +${scored.points_awarded} points.`);
      } else {
        toastSuccess(`Scored ${scored?.overall_score ?? 0}/100 — read the notes and run it again.`);
      }
    } catch (error) {
      toastError(getApiErrorMessage(error, "We couldn't score that conversation. Try again."));
    }
  };

  const handleQuit = async () => {
    if (!activeSessionId) return;
    try {
      await abandonMutation.mutateAsync(activeSessionId);
      queryClient.removeQueries({ queryKey: [ROLEPLAY_SESSION_QUERY_KEY, activeSessionId] });
      setActiveSessionId(null);
      setFailedReply({ text: "", token: 0 });
      setStep(STEPS.SCENARIOS);
      refreshProgress();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to close that conversation."));
    } finally {
      setIsQuitOpen(false);
    }
  };

  // Taken from the session rather than looked up in the catalog: a scenario
  // archived since this run would be missing from the catalog, and a silent
  // no-op is worse than the backend's own "not available right now".
  const handleRunAgain = () => {
    if (session?.scenario) handleStart(session.scenario);
  };

  const backToScenarios = () => {
    setActiveSessionId(null);
    setFailedReply({ text: "", token: 0 });
    setStep(STEPS.SCENARIOS);
  };

  if (isLoadingCatalog) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-10">
        <Loader fullScreen={false} label="Loading your training module..." />
      </div>
    );
  }

  if (step === STEPS.SESSION) {
    if (isLoadingSession && !session) {
      return (
        <div className="bg-paper border border-line rounded-2xl p-10">
          <Loader fullScreen={false} label="Opening the conversation..." />
        </div>
      );
    }

    if (!session) {
      return (
        <div className="bg-paper border border-line rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose/35 border border-clay/25 text-clay flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-serif font-light text-ink">
            We couldn&apos;t open that conversation
          </h3>
          <button
            type="button"
            onClick={backToScenarios}
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-pine hover:bg-moss text-paper font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Back to the situations
          </button>
        </div>
      );
    }

    if (session.status === "COMPLETED") {
      return (
        <EvaluationReport
          session={session}
          stats={catalog?.stats}
          onRunAgain={handleRunAgain}
          onBackToScenarios={backToScenarios}
          isRestarting={startMutation.isPending}
        />
      );
    }

    return (
      <>
        <RolePlayStage
          session={session}
          onSend={handleSend}
          isSending={replyMutation.isPending}
          onFinish={handleFinish}
          isFinishing={evaluateMutation.isPending}
          onQuit={() => setIsQuitOpen(true)}
          restoreText={failedReply.text}
          restoreToken={failedReply.token}
        />

        <ConfirmDialog
          isOpen={isQuitOpen}
          onClose={() => setIsQuitOpen(false)}
          onConfirm={handleQuit}
          isConfirming={abandonMutation.isPending}
          tone="danger"
          title="Walk away from this conversation?"
          message="It won't be scored and no points are awarded. You can start the situation again from the beginning whenever you want."
          confirmLabel="Walk away"
        />
      </>
    );
  }

  if (step === STEPS.METHOD) {
    return (
      <AbpMethodPanel
        onBack={() => setStep(STEPS.INTRO)}
        onContinue={() => {
          markIntroSeen();
          setStep(STEPS.SCENARIOS);
        }}
      />
    );
  }

  if (step === STEPS.SCENARIOS) {
    return (
      <ScenarioPicker
        scenarios={catalog?.scenarios || []}
        stats={catalog?.stats}
        onBack={() => setStep(STEPS.METHOD)}
        onStart={handleStart}
        startingScenarioId={startingScenarioId}
      />
    );
  }

  return (
    <ModuleIntroPanel
      module={catalog?.module}
      stats={catalog?.stats}
      onContinue={() => setStep(STEPS.METHOD)}
    />
  );
}
