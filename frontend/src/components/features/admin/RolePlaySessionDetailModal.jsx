"use client";

import { useQuery } from "@tanstack/react-query";
import { Theater } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getAdminRolePlaySession } from "@/services/wargamerService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-porcelain border border-line p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{label}</p>
      <p className="text-lg font-serif font-light text-ink tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

/**
 * One run's transcript and report card, read-only.
 *
 * Exists so an admin can see *how* a student handled the pressure, not just
 * the number — which is the whole point of a role-play exercise over a quiz.
 */
export default function RolePlaySessionDetailModal({ sessionId, onClose }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-roleplay-session", sessionId],
    queryFn: async () => {
      const response = await getAdminRolePlaySession(sessionId);
      return response?.data || null;
    },
    enabled: Boolean(sessionId),
  });

  const scenario = data?.scenario;

  return (
    <Modal
      isOpen={Boolean(sessionId)}
      onClose={onClose}
      icon={Theater}
      title="Role-Play Run"
      subtitle={
        data
          ? `${data.student_name || data.student_email} · ${scenario?.title || ""}`
          : "Loading the transcript..."
      }
      maxWidth="max-w-3xl"
    >
      {isLoading && <Loader fullScreen={false} label="Loading the transcript..." />}

      {isError && (
        <p className="text-sm text-rose-700 font-light">
          {getApiErrorMessage(error, "Unable to load this run.")}
        </p>
      )}

      {data && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge size="lg" status={data.status} />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
              {scenario?.code} &middot; {data.persona_display}
            </span>
            <span className="text-[11px] text-muted font-light ml-auto">
              {formatDateTime(data.created_at)}
            </span>
          </div>

          {data.overall_score !== null && data.overall_score !== undefined && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric label="Overall" value={data.overall_score} />
                {(data.rubric || []).map((criterion) => (
                  <Metric key={criterion.key} label={criterion.label} value={criterion.score} />
                ))}
              </div>

              {data.verdict && (
                <div className="rounded-xl bg-porcelain border border-line p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">
                    {data.passed ? "Passed" : "Did not pass"} &middot; {data.verdict}
                  </p>
                  <p className="text-sm text-ink font-light leading-relaxed">{data.summary}</p>
                </div>
              )}

              {data.used_fabricated_excuse && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-800 mb-1">
                    Made-up excuse flagged
                  </p>
                  <p className="text-sm text-ink font-light leading-relaxed">
                    {data.fabrication_note}
                  </p>
                </div>
              )}
            </>
          )}

          {data.status === "EVALUATING" && data.error_message && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-rose-700 mb-1">
                Scoring didn&apos;t finish
              </p>
              <p className="text-sm text-ink font-light leading-relaxed">{data.error_message}</p>
              <p className="text-[11px] text-muted font-light mt-2">
                The transcript is intact — the student can ask for their score again from their
                portal.
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
              Transcript
            </p>
            <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
              {(data.turns || []).map((turn) => {
                const isAthlete = turn.speaker === "ATHLETE";
                return (
                  <div
                    key={turn.id}
                    className={`flex ${isAthlete ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[80%] flex flex-col gap-1">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-widest text-muted ${
                          isAthlete ? "text-right" : ""
                        }`}
                      >
                        {isAthlete ? "Student" : scenario?.counterpart_role}
                      </span>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm font-light leading-relaxed whitespace-pre-wrap break-words ${
                          isAthlete
                            ? "bg-pine text-paper rounded-br-md"
                            : "bg-porcelain border border-line text-ink rounded-bl-md"
                        }`}
                      >
                        {turn.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
