"use client";

import { Award, Printer } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import { formatDate } from "@/lib/adminFormatters";

export default function CertificateModal({ certificate, studentName, onClose }) {
  if (!certificate) return null;
  const course = certificate.course || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-cn-p-ink/60 p-4 backdrop-blur-md print:bg-white print:p-0 print:backdrop-blur-none">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-cn-p border border-cn-p-line bg-cn-p-card shadow-cn-p print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
        {/* A dialog is marked by its radius and shadow alone — the same way
            `components/ui/Modal` does it. This one is hand-rolled rather than
            built on Modal because it has to print: the whole certificate is a
            print target, which needs its own `print:` rules on the overlay. */}
        <CloseButton
          onClick={onClose}
          className="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-cn-p-sm bg-cn-p-page text-cn-p-ink-2 transition-colors duration-150 hover:bg-cn-p-line hover:text-cn-p-ink print:hidden"
          title="Close certificate"
        />

        <div className="p-6 sm:p-10 print:p-8">
          <div className="relative space-y-6 rounded-cn-p border border-cn-p-line bg-[linear-gradient(180deg,#fff,#f7f9ff)] p-8 text-center before:pointer-events-none before:absolute before:inset-2.5 before:rounded-[10px] before:border-[1.5px] before:border-cn-p-accent-soft before:content-[''] sm:p-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-cn-p bg-cn-p-soft text-cn-p-soft-ink">
              <Award className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold tracking-[0.08em] text-cn-p-ink-2 uppercase">
                Certificate of completion
              </p>
              <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-cn-p-ink sm:text-3xl">
                {course.title}
              </h2>
              {course.code ? (
                <p className="text-sm font-semibold text-cn-p-muted">
                  {course.code}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <p className="text-sm text-cn-p-ink-2">This certifies that</p>
              <p className="text-xl font-bold text-cn-p-ink">{studentName}</p>
              <p className="text-sm text-cn-p-ink-2">
                has successfully completed all coursework
                {course.category ? ` in ${course.category}` : ""}.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-x-6 gap-y-1 border-t border-cn-p-line pt-4 text-sm text-cn-p-ink-2 sm:flex-row">
              <span>Completed {formatDate(certificate.completed_at)}</span>
              <span>Score {Math.round(certificate.completion_percentage)}%</span>
            </div>
          </div>

          <div className="flex justify-center mt-6 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-cn-p-sm bg-cn-p-accent px-[18px] text-sm font-semibold text-white transition-colors duration-150 hover:bg-cn-p-accent-hover"
            >
              <Printer className="w-4 h-4" />
              Print / save as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
