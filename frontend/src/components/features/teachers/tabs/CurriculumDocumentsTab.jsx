"use client";

import { Clock, Download, Eye, FileText } from "lucide-react";
import PortalCard from "@/components/features/portal/shell/PortalCard";
import {
  PortalButton,
  PortalIcon,
  PortalPageHead,
  PortalPill,
} from "@/components/features/portal/shell/PortalUI";

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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Curriculum documents"
        subtitle="Syllabi, facilitator guides and credentials. Always the latest version."
      />

      <div className="grid gap-3 md:grid-cols-2">
        {CURRICULUM_DOCUMENTS.map((doc) => (
          <PortalCard key={doc.id} className="flex items-start gap-4 p-5">
            <PortalIcon icon={FileText} size="lg" />

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <PortalPill tone="blue" className="self-start">
                {doc.category}
              </PortalPill>
              <h3 className="text-base font-bold text-cn-p-ink">{doc.title}</h3>
              <p className="text-sm leading-relaxed text-cn-p-ink-2">{doc.description}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-cn-p-muted">
                <span>{doc.version}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                  Compiled {doc.lastUpdated}
                </span>
                <span aria-hidden="true">·</span>
                <span>{doc.format}</span>
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <PortalButton
                  variant="sec"
                  size="sm"
                  onClick={() =>
                    window.alert(
                      `Preview for "${doc.title}" is not wired up yet. Contact your licensing representative for printed copies.`,
                    )
                  }
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </PortalButton>
                <PortalButton
                  size="sm"
                  onClick={() =>
                    window.alert(
                      `Download for "${doc.title}" is not wired up yet.`,
                    )
                  }
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </PortalButton>
              </div>
            </div>
          </PortalCard>
        ))}
      </div>
    </div>
  );
}
