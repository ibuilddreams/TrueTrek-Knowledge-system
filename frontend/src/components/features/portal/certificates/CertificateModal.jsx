"use client";

import { Award, Printer } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import { formatDate } from "@/lib/adminFormatters";

export default function CertificateModal({ certificate, studentName, onClose }) {
  if (!certificate) return null;
  const course = certificate.course || {};

  return (
    <div className="fixed inset-0 z-[100] bg-ink/60 backdrop-blur-md flex items-center justify-center p-4 print:bg-paper print:backdrop-blur-none print:p-0">
      <div className="relative bg-paper border border-line rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl print:max-w-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none print:rounded-none">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pine via-moss to-gold print:hidden" />

        <CloseButton
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-muted hover:text-ink p-2 hover:bg-porcelain rounded-full transition print:hidden"
          title="Close certificate"
        />

        <div className="p-6 sm:p-10 print:p-8">
          <div className="border-4 border-double border-gold/40 rounded-2xl p-8 sm:p-12 text-center space-y-6 bg-gradient-to-br from-gold/12 via-paper to-porcelain">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gold/12 border border-gold/25 text-gold flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-gold">
                Certificate of Completion
              </p>
              <h2 className="font-serif font-black text-2xl sm:text-3xl text-ink">
                {course.title}
              </h2>
              {course.code ? (
                <p className="text-sm font-mono text-muted uppercase tracking-wider">
                  {course.code}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted font-light">This certifies that</p>
              <p className="font-serif font-bold text-xl text-ink">{studentName}</p>
              <p className="text-sm text-muted font-light">
                has successfully completed all coursework
                {course.category ? ` in ${course.category}` : ""}.
              </p>
            </div>

            <div className="pt-4 border-t border-gold/25 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-1 text-xs font-mono text-muted uppercase tracking-wider">
              <span>Completed {formatDate(certificate.completed_at)}</span>
              <span>Score {Math.round(certificate.completion_percentage)}%</span>
            </div>
          </div>

          <div className="flex justify-center mt-6 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-3 bg-pine hover:bg-moss text-paper font-bold font-mono text-sm uppercase tracking-wider rounded-xl transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
