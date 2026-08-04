"use client";

import { useState } from "react";
import { AlertCircle, Award, CalendarCheck, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useStudentCertificates } from "@/hooks/student/useStudentCertificates";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import CertificateModal from "../certificates/CertificateModal";

function CertificateCard({ certificate, onOpen }) {
  const course = certificate.course || {};

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full text-left rounded-2xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-[0_10px_30px_-20px_rgba(28,25,23,0.35)] transition p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
            {course.category || "Course"}
          </p>
          <h3 className="font-serif font-bold text-stone-900 mt-0.5 truncate">
            {course.title}
          </h3>
        </div>
        <span className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Award className="w-4 h-4" />
        </span>
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-400">
        <span className="flex items-center gap-1">
          <CalendarCheck className="w-3.5 h-3.5" />
          {formatDate(certificate.completed_at)}
        </span>
        <span className="text-amber-800 font-bold">
          {Math.round(certificate.completion_percentage)}%
        </span>
      </div>
      <span className="block text-center text-[11px] font-mono uppercase tracking-wider text-stone-600 border border-stone-200 rounded-xl py-2 group-hover:border-amber-300">
        View Certificate
      </span>
    </button>
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

  let content;

  if (isLoading) {
    content = (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        aria-busy="true"
      >
        <Loader fullScreen={false} label="Loading your certificates..." />
      </div>
    );
  } else if (isError) {
    content = (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
          Failed to Load Certificates
        </h2>
        <p className="text-xs text-stone-500 font-light mb-6">
          {getApiErrorMessage(error, "Unable to load your certificates.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  } else if (certificates.length === 0) {
    content = (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70">
        <EmptyState
          icon={Award}
          label="No certificates yet"
          description="Complete every lesson and quiz in a course to earn its certificate."
        />
      </div>
    );
  } else {
    content = (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {certificates.map((certificate) => (
          <CertificateCard
            key={certificate.id}
            certificate={certificate}
            onOpen={() => setOpenCertificate(certificate)}
          />
        ))}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700/80 mb-2">
          Completed courses
        </p>
        <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
          Your certificates
        </h2>
        <p className="text-sm text-stone-500 font-light mt-2">
          Earned automatically once every lesson and quiz in a course is
          completed.
        </p>
      </div>

      {content}

      <CertificateModal
        certificate={openCertificate}
        studentName={studentName}
        onClose={() => setOpenCertificate(null)}
      />
    </div>
  );
}
