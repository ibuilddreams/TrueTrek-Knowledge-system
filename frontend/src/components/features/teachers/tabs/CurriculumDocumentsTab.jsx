"use client";

import { Clock, Eye, Download } from 'lucide-react';

const CURRICULUM_DOCUMENTS = [
  {
    id: 'doc-syllabus',
    title: 'Framework Syllabus: Institutional Facilitator manual',
    version: 'v4.2.1',
    category: 'Syllabus',
    description: 'Complete compliance roadmap, instructional matrices, and performance diagnostic metrics for Tiers 1 through 11.',
    format: 'PDF (34 Pages)',
    lastUpdated: 'May 2026'
  },
  {
    id: 'doc-ferpa',
    title: 'FERPA & Cohort Privacy Action Guidelines',
    version: 'v2.1.0',
    category: 'Privacy',
    description: 'Required protocols for administrators managing student profile intake dossiers, security locks, and credential records.',
    format: 'DOCX (12 Pages)',
    lastUpdated: 'March 2026'
  },
  {
    id: 'doc-nil-compliance',
    title: 'NIL Contract Redline Compliance Manual',
    version: 'v8.4.2',
    category: 'Athletic Law',
    description: 'Expert regulatory audit checklist for collegiate sponsorships, brand non-competes, and uniform licensing covenants.',
    format: 'PDF (68 Pages)',
    lastUpdated: 'June 2026'
  },
  {
    id: 'doc-cognitive-checklist',
    title: 'Circadian Optimization & Focus Exercise Manual',
    version: 'v3.0.1',
    category: 'Neurobiology',
    description: 'Academic class drill instructions, tracking matrices, and cognitive recovery index protocols.',
    format: 'PDF (18 Pages)',
    lastUpdated: 'April 2026'
  }
];

export default function CurriculumDocumentsTab() {
  return (
    <div className="space-y-8">

      {/* Document Repository list */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">

        <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-stone-100 gap-4 mb-6">
          <div>
            <h3 className="font-serif font-black text-xl text-stone-900">Document Locker & Credentials Assets</h3>
            <p className="text-sm text-stone-500 font-light mt-0.5">Deploy licensed publications directly with classrooms, students, and legal guardians.</p>
          </div>

          <span className="text-sm font-mono bg-amber-50 text-amber-700 px-3 py-1.5 border border-amber-200/50 rounded-xl font-bold">
            4 LICID REPOSITORY ASSETS ACTIVE
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {CURRICULUM_DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-stone-50/50 px-4 -mx-4 rounded-xl transition-colors duration-250"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200/50 rounded">
                    {doc.category}
                  </span>
                  <span className="text-[11px] font-mono text-stone-400">Version {doc.version}</span>
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-base leading-snug">
                  {doc.title}
                </h4>
                <p className="text-sm text-stone-550 leading-relaxed font-light">
                  {doc.description}
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-stone-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 stroke-2" />
                    Compiled: {doc.lastUpdated}
                  </span>
                  <span>Format: {doc.format}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => window.alert(`Syllabus framework preview for "${doc.title}" initiated. Contact licensing representatve for physical prints.`)}
                  className="px-4 py-2 bg-stone-50 border border-stone-200 hover:bg-stone-100 rounded-xl text-stone-700 text-sm font-mono font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  PREVIEW
                </button>
                <button
                  onClick={() => window.alert(`Licensing Verified. Download of "${doc.title}" formatted for institutional use has begun. Check your browser downloads directory.`)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 rounded-xl text-stone-100 text-sm font-mono font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD PDF
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
