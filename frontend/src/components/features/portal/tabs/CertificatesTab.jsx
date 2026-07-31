"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Award, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { getStudentCertificates } from "@/services/studentLearningService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

export default function CertificatesTab() {
  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["studentCertificates"],
    queryFn: async () => {
      const response = await getStudentCertificates();
      return response?.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading certificates..." />
      </div>
    );
  }

  if (isError) {
    return (
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
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70">
        <EmptyState
          icon={Award}
          label="No certificates yet"
          description="Complete a course to earn a certificate. Finished courses will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-700/80 mb-2">
          Recognition
        </p>
        <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
          Certificates
        </h2>
        <p className="text-sm text-stone-500 font-light mt-1.5">
          Credentials earned from courses you have completed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((certificate, index) => (
          <motion.article
            key={certificate.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-stone-50 p-6 shadow-sm"
          >
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-amber-400/10 blur-2xl" />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl border border-amber-200 bg-white text-amber-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-amber-700/80">
                  {certificate.course?.category || "Course certificate"}
                </p>
                <h3 className="font-serif font-bold text-lg text-stone-900 mt-1 leading-snug">
                  {certificate.course?.title}
                </h3>
                <p className="text-[12px] text-stone-500 mt-2">
                  {certificate.course?.code || "No code"} · Completed{" "}
                  {formatDate(certificate.completed_at)}
                </p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
