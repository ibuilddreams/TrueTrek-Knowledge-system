"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckSquare,
  Download,
  FileText,
  Loader2,
  ListChecks,
  NotebookPen,
  ScrollText,
  Sparkles,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useClassNotes } from "@/hooks/useClassNotes";
import { downloadClassNotesDocument } from "@/services/classSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import { formatClassDate, formatClassTime } from "./classSessionUtils";

/**
 * Reading back the notes from a class that has finished.
 *
 * The notes come down with this request rather than sitting in a list
 * payload, for the same reason a recording's link does: they are only for
 * people on this course, and the check that decides that belongs on the
 * request that serves them.
 *
 * The transcript is **only ever present for a teacher** — the server decides
 * that, not this component (class_sessions/services.py::notes_state) — which
 * is why it is rendered behind a toggle rather than shown by default: it is
 * a verbatim record of who said what in a room that may be full of minors,
 * kept so the person who taught the class can check the notes against it.
 */

function Section({ icon: Icon, title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="inline-flex items-center gap-2 text-[11px] font-semibold text-cn-p-accent">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function ClassNotesModal({ session, isOpen, onClose }) {
  const { data, isLoading, isError, error } = useClassNotes(session?.id, {
    enabled: Boolean(isOpen && session?.id),
  });
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const notes = data?.notes || null;
  const transcript = data?.transcript || "";
  // "Manan: so the first thing" → a name and what they said, so the two can
  // be set apart. A line without that shape is shown as it stands rather
  // than forced into a speaker it does not have.
  const transcriptTurns = useMemo(
    () =>
      transcript
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const match = line.match(/^([^:]{1,60}?):\s*(.*)$/);
          return match
            ? { speaker: match[1], words: match[2] }
            : { speaker: "", words: line };
        }),
    [transcript],
  );
  const isPending = Boolean(data?.is_transcribing || data?.is_writing);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const { blob, filename } = await downloadClassNotesDocument(session.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "class-notes.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      toastError(
        getApiErrorMessage(downloadError, "Couldn't download these notes."),
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={NotebookPen}
      title="Class notes"
      subtitle={session?.title}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-cn-p-ink-2">
          <span>
            {session?.course_code} · {session?.course_title}
          </span>
          <span>
            {formatClassDate(session?.scheduled_at)} ·{" "}
            {formatClassTime(session?.scheduled_at)}
          </span>
        </div>

        {isLoading && (
          <div className="rounded-2xl bg-cn-p-page border border-cn-p-line py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-cn-p-ink-2 animate-spin" />
            <p className="text-xs font-semibold text-cn-p-ink-2">
              Fetching the notes…
            </p>
          </div>
        )}

        {!isLoading && (isError || !notes) && (
          <div className="rounded-2xl bg-cn-p-page border border-cn-p-line py-14 px-8 flex flex-col items-center justify-center gap-3 text-center">
            <span className="w-11 h-11 rounded-2xl bg-cn-p-bad-bg border border-cn-p-bad-bg text-cn-p-bad flex items-center justify-center">
              {isPending ? (
                <Sparkles className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </span>
            <p className="text-sm font-light text-cn-p-ink-2 leading-relaxed max-w-sm">
              {isError
                ? getApiErrorMessage(error, "These notes couldn't be loaded.")
                : isPending
                  ? "This class has finished and the notes are still being written. You'll get a notification the moment they're ready."
                  : // Why the last attempt came to nothing, when there is a
                    // reason to give. The server only ever puts one here for
                    // a teacher (class_sessions/services.py::notes_state), so
                    // a student still sees the plain sentence below.
                    data?.error || "There are no notes from this class."}
            </p>
          </div>
        )}

        {!isLoading && notes && (
          <>
            <div>
              <h2 className="text-lg font-extrabold tracking-[-0.02em] text-cn-p-ink leading-snug">
                {notes.title}
              </h2>
              {notes.summary && (
                <p className="text-sm text-cn-p-ink font-light leading-relaxed mt-2">
                  {notes.summary}
                </p>
              )}
            </div>

            {(notes.key_topics || []).length > 0 && (
              <Section icon={ListChecks} title="What we covered">
                <ul className="flex flex-wrap gap-2">
                  {notes.key_topics.map((topic, index) => (
                    <li
                      key={`topic-${index}`}
                      className="px-3 py-1 rounded-full bg-cn-p-page border border-cn-p-line text-xs font-light text-cn-p-ink"
                    >
                      {topic}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {(notes.important_points || []).length > 0 && (
              <Section icon={FileText} title="Key points">
                <ul className="space-y-3">
                  {notes.important_points.map((entry, index) => (
                    <li key={`point-${index}`} className="flex items-start gap-2.5">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cn-p-accent shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-cn-p-ink leading-snug">
                          {entry.point}
                        </span>
                        {entry.detail && (
                          <span className="block text-xs text-cn-p-ink-2 font-light leading-relaxed mt-0.5">
                            {entry.detail}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {(notes.action_items || []).length > 0 && (
              <Section icon={CheckSquare} title="Action items">
                <ul className="space-y-2">
                  {notes.action_items.map((entry, index) => (
                    <li
                      key={`action-${index}`}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-cn-p-page border border-cn-p-line"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-cn-p-accent mt-0.5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm text-cn-p-ink font-light leading-snug">
                          {entry.task}
                        </span>
                        {(entry.owner || entry.due) && (
                          <span className="block text-[11px] font-semibold text-cn-p-ink-2 mt-1">
                            {[entry.owner, entry.due].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {notes.next_class && (
              <Section icon={Sparkles} title="Next class">
                <p className="text-sm text-cn-p-ink font-light leading-relaxed">
                  {notes.next_class}
                </p>
              </Section>
            )}

            {/* Teachers only — the server simply doesn't send this to anyone
                else, so there is no role check to keep in step here. */}
            {transcript && (
              <section className="space-y-2">
                {/* The heading and its toggle share a row rather than both
                    being inline-level in a stacked section, which ran them
                    together as "TRANSCRIPTSHOW WHAT WAS SAID". */}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <h3 className="inline-flex items-center gap-2 text-[11px] font-semibold text-cn-p-accent">
                    <ScrollText className="w-3.5 h-3.5" />
                    Transcript
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsTranscriptOpen((open) => !open)}
                    aria-expanded={isTranscriptOpen}
                    className="text-[11px] font-semibold text-cn-p-ink-2 hover:text-cn-p-ink transition-colors cursor-pointer"
                  >
                    {isTranscriptOpen ? "Hide" : "Show"} what was said
                  </button>
                </div>
                {isTranscriptOpen && (
                  <div className="max-h-72 overflow-auto rounded-xl bg-cn-p-page border border-cn-p-line p-4 space-y-2">
                    {transcriptTurns.map((turn, index) => (
                      <p
                        key={`turn-${index}`}
                        className="text-xs text-cn-p-ink font-light leading-relaxed"
                      >
                        {turn.speaker && (
                          <span className="font-semibold text-cn-p-ink">
                            {turn.speaker}:{" "}
                          </span>
                        )}
                        {turn.words}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-[11px] font-light text-cn-p-ink-2 leading-relaxed">
                  Only this course&apos;s teachers can see the transcript. Your
                  students get the notes above, and your copy of the PDF has
                  the conversation under them.
                </p>
              </section>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-cn-p-line">
              <p className="text-[11px] font-light text-cn-p-ink-2 leading-relaxed max-w-sm">
                These notes were written automatically from a transcript of the
                class and haven&apos;t been checked by your teacher. Treat
                anything surprising as something to ask about.
              </p>
              {notes.has_document && (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  {isDownloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  PDF
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
