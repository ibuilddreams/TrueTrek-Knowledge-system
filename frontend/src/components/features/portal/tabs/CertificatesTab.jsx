"use client";

import { useState } from "react";
import { AlertCircle, Award, RefreshCw } from "lucide-react";
import { useStudentCertificates } from "@/hooks/student/useStudentCertificates";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import Loader from "@/components/ui/Loader";
import PortalCard from "../shell/PortalCard";
import { PortalButton, PortalEmpty, PortalPageHead } from "../shell/PortalUI";
import CertificateModal from "../certificates/CertificateModal";

// The design's `SP.certificates`: a grid of cards, each previewing the
// certificate itself rather than describing it in a row of metadata. The
// preview is the point — it is the thing being awarded, so the card shows it.

/**
 * `.cert` — the certificate face. The inner hairline is the design's
 * `::before`, an inset rule in the soft accent that reads as an engraved
 * border; it is decorative, so it is drawn by a pseudo-element rather than a
 * node a screen reader would have to step over.
 */
function CertificateFace({ courseTitle, studentName, className = "" }) {
  return (
    <div
      className={`relative flex flex-col items-center gap-3 rounded-cn-p border border-cn-p-line bg-[linear-gradient(180deg,#fff,#f7f9ff)] text-center before:pointer-events-none before:absolute before:inset-2.5 before:rounded-[10px] before:border-[1.5px] before:border-cn-p-accent-soft before:content-[''] ${className}`}
    >
      <img
        src="/images/coolnerdz-wordmark.png"
        alt=""
        aria-hidden="true"
        width={480}
        height={115}
        className="h-[22px] w-auto object-contain"
      />
      <span className="text-xs text-cn-p-muted">Certificate of completion</span>
      <b className="text-base leading-snug font-bold text-cn-p-ink">{courseTitle}</b>
      {studentName && (
        <span className="text-xs text-cn-p-muted">{studentName}</span>
      )}
    </div>
  );
}

export default function CertificatesTab({ studentName }) {
  const [openCertificate, setOpenCertificate] = useState(null);
  const {
    data: certificates = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useStudentCertificates();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading your certificates..." />
      </div>
    );
  }

  if (isError) {
    return (
      <PortalCard className="mx-auto max-w-lg p-10 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h2 className="mb-2 text-xl font-bold tracking-[-0.015em] text-cn-p-ink">
          Failed to load certificates
        </h2>
        <p className="mb-6 text-sm text-cn-p-ink-2">
          {getApiErrorMessage(error, "Unable to load your certificates.")}
        </p>
        <PortalButton onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </PortalButton>
      </PortalCard>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Certificates"
        subtitle="Issued automatically when you finish every lesson, assignment and quiz in a course."
      />

      {certificates.length === 0 ? (
        <PortalCard>
          <PortalEmpty
            icon={Award}
            title="No certificates yet"
            text="Finish a course to earn your first certificate."
          />
        </PortalCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => {
            const course = certificate.course || {};
            return (
              <PortalCard key={certificate.id} className="flex flex-col gap-3 p-5">
                <CertificateFace
                  courseTitle={course.title}
                  studentName={studentName}
                  className="p-6"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <b className="block truncate text-sm font-semibold text-cn-p-ink">
                      {course.category || "Course"}
                    </b>
                    <span className="text-xs text-cn-p-muted">
                      Issued {formatDate(certificate.completed_at)}
                    </span>
                  </div>
                  <PortalButton
                    variant="sec"
                    size="sm"
                    onClick={() => setOpenCertificate(certificate)}
                  >
                    View
                  </PortalButton>
                </div>
              </PortalCard>
            );
          })}
        </div>
      )}

      <CertificateModal
        certificate={openCertificate}
        studentName={studentName}
        onClose={() => setOpenCertificate(null)}
      />
    </div>
  );
}
