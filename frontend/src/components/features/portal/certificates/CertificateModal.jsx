"use client";

import { Award, Printer } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import { formatDate } from "@/lib/adminFormatters";

export default function CertificateModal({ certificate, studentName, onClose }) {
  if (!certificate) return null;
  const course = certificate.course || {};

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 print:bg-white print:backdrop-blur-none print:p-0">
      <div className="relative bg-white border border-stone-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl print:max-w-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none print:rounded-none">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800 print:hidden" />

        <CloseButton
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-stone-400 hover:text-stone-900 p-2 hover:bg-stone-100 rounded-full transition print:hidden"
          title="Close certificate"
        />

        <div className="p-6 sm:p-10 print:p-8">
          <div className="border-4 border-double border-amber-700/40 rounded-2xl p-8 sm:p-12 text-center space-y-6 bg-gradient-to-br from-amber-50/60 via-white to-stone-50">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-600/10 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-700/80">
                Certificate of Completion
              </p>
              <h2 className="font-serif font-black text-2xl sm:text-3xl text-stone-900">
                {course.title}
              </h2>
              {course.code ? (
                <p className="text-sm font-mono text-stone-400 uppercase tracking-wider">
                  {course.code}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <p className="text-sm text-stone-500 font-light">This certifies that</p>
              <p className="font-serif font-bold text-xl text-stone-900">{studentName}</p>
              <p className="text-sm text-stone-500 font-light">
                has successfully completed all coursework
                {course.category ? ` in ${course.category}` : ""}.
              </p>
            </div>

            <div className="pt-4 border-t border-amber-200/50 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-1 text-xs font-mono text-stone-500 uppercase tracking-wider">
              <span>Completed {formatDate(certificate.completed_at)}</span>
              <span>Score {Math.round(certificate.completion_percentage)}%</span>
            </div>
          </div>

          <div className="flex justify-center mt-6 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-sm uppercase tracking-wider rounded-xl transition"
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
