"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useTheme } from "@/hooks/useTheme";
import {
  BULK_IMPORT_CONFIG,
  buildErrorReportCsv,
  buildSkippedReportCsv,
  downloadBlob,
  validateImportFileHeaders,
} from "@/lib/bulkImport";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

function getSkippedRowDisplay(entry, type) {
  if (type === "enrollments") {
    return {
      title: entry.course_code || "Enrollment",
      subtitle: [entry.student_email, entry.teacher_email].filter(Boolean).join(" · "),
    };
  }
  return {
    title: [entry.first_name, entry.last_name].filter(Boolean).join(" ") || entry.email || entry.username,
    subtitle: [entry.email, entry.username].filter(Boolean).join(" · "),
  };
}

function ImportSummary({ result, type, onDownloadErrors, onDownloadSkipped, isVault }) {
  const total = result.total_rows || 0;
  const success = result.success_count || 0;
  const skipped = result.skipped_count || 0;
  const failed = result.failed_count || 0;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
  const errors = result.errors || [];
  const skippedRows = result.skipped || [];

  const outcome =
    failed === 0 && skipped === 0
      ? "success"
      : success === 0
        ? "failed"
        : "partial";

  const outcomeMeta = {
    success: {
      icon: CheckCircle2,
      label: "Import completed successfully",
      detail: `${success} row${success === 1 ? "" : "s"} imported with no errors.`,
      wrap: isVault ? "border-emerald-500/20 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50/70",
      iconWrap: isVault ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700",
      labelClass: isVault ? "text-emerald-300" : "text-emerald-900",
      detailClass: isVault ? "text-emerald-400/80" : "text-emerald-700/80",
    },
    partial: {
      icon: AlertTriangle,
      label: "Import completed with some rows skipped or failed",
      detail: `${success} created, ${skipped} skipped as duplicates, ${failed} failed. Review the details below.`,
      wrap: isVault ? "border-amber-500/20 bg-amber-500/10" : "border-amber-200 bg-amber-50/70",
      iconWrap: isVault ? "bg-amber-500/15 text-amber-400" : "bg-amber-100 text-amber-800",
      labelClass: isVault ? "text-amber-300" : "text-amber-950",
      detailClass: isVault ? "text-amber-400/80" : "text-amber-800/80",
    },
    failed: {
      icon: XCircle,
      label: "Import finished with no new records created",
      detail:
        skipped > 0 && failed === 0
          ? `All ${skipped} row${skipped === 1 ? "" : "s"} matched existing accounts and were skipped.`
          : `All ${total} row${total === 1 ? "" : "s"} were skipped or failed. Review the details below.`,
      wrap: isVault ? "border-rose-500/20 bg-rose-500/10" : "border-rose-200 bg-rose-50/70",
      iconWrap: isVault ? "bg-rose-500/15 text-rose-400" : "bg-rose-100 text-rose-700",
      labelClass: isVault ? "text-rose-300" : "text-rose-950",
      detailClass: isVault ? "text-rose-400/80" : "text-rose-700/80",
    },
  }[outcome];

  const OutcomeIcon = outcomeMeta.icon;

  const groupedErrors = useMemo(() => {
    const groups = new Map();
    errors.forEach((entry) => {
      const key = entry.error || "Unknown error";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    });
    return Array.from(groups.entries()).map(([message, rows]) => ({
      message,
      rows,
      count: rows.length,
    }));
  }, [errors]);

  const cardWrap = isVault ? "border-stone-700/60 bg-white/5" : "border-stone-200 bg-white";
  const cardHeaderWrap = isVault ? "border-stone-800 bg-white/5" : "border-stone-100 bg-stone-50/80";
  const mutedLabel = isVault ? "text-stone-500" : "text-stone-400";
  const mutedText = isVault ? "text-stone-500" : "text-stone-500";
  const chipWrap = isVault ? "bg-white/5 border-stone-700/60 text-stone-400" : "bg-stone-50 border-stone-200 text-stone-600";
  const divideClass = isVault ? "divide-stone-800" : "divide-stone-100";

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${outcomeMeta.wrap}`}>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${outcomeMeta.iconWrap}`}
        >
          <OutcomeIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-serif font-bold leading-tight ${outcomeMeta.labelClass}`}>
            {outcomeMeta.label}
          </p>
          <p className={`text-xs mt-1 leading-relaxed ${outcomeMeta.detailClass}`}>
            {outcomeMeta.detail}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        <div className={`rounded-2xl border p-3.5 ${cardWrap}`}>
          <p className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${mutedLabel}`}>
            Total
          </p>
          <p className={`text-2xl font-serif font-bold mt-1 tabular-nums ${isVault ? "text-stone-50" : "text-stone-900"}`}>
            {total}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-3.5 ${
            isVault ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-200/80 bg-emerald-50/40"
          }`}
        >
          <p
            className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
              isVault ? "text-emerald-400" : "text-emerald-700"
            }`}
          >
            Created
          </p>
          <p
            className={`text-2xl font-serif font-bold mt-1 tabular-nums ${
              isVault ? "text-emerald-400" : "text-emerald-700"
            }`}
          >
            {success}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-3.5 ${
            isVault ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200/80 bg-amber-50/40"
          }`}
        >
          <p
            className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
              isVault ? "text-amber-400" : "text-amber-700"
            }`}
          >
            Skipped
          </p>
          <p
            className={`text-2xl font-serif font-bold mt-1 tabular-nums ${
              isVault ? "text-amber-400" : "text-amber-700"
            }`}
          >
            {skipped}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-3.5 ${
            isVault ? "border-rose-500/20 bg-rose-500/5" : "border-rose-200/80 bg-rose-50/40"
          }`}
        >
          <p
            className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
              isVault ? "text-rose-400" : "text-rose-700"
            }`}
          >
            Failed
          </p>
          <p
            className={`text-2xl font-serif font-bold mt-1 tabular-nums ${
              isVault ? "text-rose-400" : "text-rose-700"
            }`}
          >
            {failed}
          </p>
        </div>
      </div>

      <div className={`rounded-2xl border p-3.5 space-y-2 ${cardWrap}`}>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${isVault ? "text-stone-400" : "text-stone-500"}`}>
            Success rate
          </p>
          <p className={`text-xs font-mono font-semibold tabular-nums ${isVault ? "text-stone-300" : "text-stone-700"}`}>
            {successRate}%
          </p>
        </div>
        <div className={`h-2.5 rounded-full overflow-hidden ${isVault ? "bg-white/10" : "bg-stone-100"}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              outcome === "failed"
                ? "bg-rose-500"
                : outcome === "partial"
                  ? "bg-gradient-to-r from-amber-500 to-emerald-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {skippedRows.length > 0 && (
        <div className={`rounded-2xl border overflow-hidden ${cardWrap}`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${cardHeaderWrap}`}>
            <div>
              <p className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${mutedLabel}`}>
                Skipped duplicates
              </p>
              <p className={`text-[11px] mt-0.5 ${mutedText}`}>
                {skippedRows.length} row{skippedRows.length === 1 ? "" : "s"} already existed and{" "}
                {skippedRows.length === 1 ? "was" : "were"} left unchanged.
              </p>
            </div>
            {onDownloadSkipped && (
              <button
                type="button"
                onClick={onDownloadSkipped}
                className={`shrink-0 px-3 py-2 rounded-lg border text-[10px] font-mono uppercase tracking-wider font-semibold transition flex items-center gap-1.5 ${
                  isVault
                    ? "border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400"
                    : "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900"
                }`}
              >
                <Download className="w-3 h-3" />
                Skipped Report
              </button>
            )}
          </div>

          <div className={`max-h-56 overflow-y-auto divide-y ${divideClass}`}>
            {skippedRows.map((entry) => {
              const display = getSkippedRowDisplay(entry, type);
              return (
                <div
                  key={`${entry.row}-${entry.email || entry.student_email}`}
                  className="px-4 py-3 flex items-start gap-2.5"
                >
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      isVault
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-amber-50 border-amber-100 text-amber-700"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-xs font-medium truncate ${isVault ? "text-stone-100" : "text-stone-800"}`}>
                        {display.title}
                      </p>
                      <p className={`text-[11px] mt-0.5 truncate ${isVault ? "text-stone-500" : "text-stone-500"}`}>
                        {display.subtitle}
                      </p>
                      <p className={`text-[11px] mt-0.5 truncate ${isVault ? "text-amber-400" : "text-amber-700"}`}>
                        {entry.reason}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isVault
                          ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                          : "bg-amber-50 border border-amber-100 text-amber-700"
                      }`}
                    >
                      R{entry.row}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className={`rounded-2xl border overflow-hidden ${cardWrap}`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${cardHeaderWrap}`}>
            <div>
              <p className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${mutedLabel}`}>
                Row errors
              </p>
              <p className={`text-[11px] mt-0.5 ${mutedText}`}>
                {errors.length} failed row{errors.length === 1 ? "" : "s"} · {groupedErrors.length}{" "}
                issue type{groupedErrors.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={onDownloadErrors}
              className={`shrink-0 px-3 py-2 rounded-lg border text-[10px] font-mono uppercase tracking-wider font-semibold transition flex items-center gap-1.5 ${
                isVault
                  ? "border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400"
                  : "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900"
              }`}
            >
              <Download className="w-3 h-3" />
              Error Report
            </button>
          </div>

          <div className={`max-h-56 overflow-y-auto divide-y ${divideClass}`}>
            {groupedErrors.map((group) => (
              <div key={group.message} className="px-4 py-3.5">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      isVault
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-rose-50 border-rose-100 text-rose-600"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-medium leading-relaxed ${isVault ? "text-rose-300" : "text-rose-800"}`}>
                        {group.message}
                      </p>
                      <span
                        className={`shrink-0 text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isVault
                            ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                            : "bg-rose-50 border border-rose-100 text-rose-600"
                        }`}
                      >
                        {group.count}×
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {group.rows.slice(0, 8).map((entry) => {
                        const email =
                          entry.data?.student_email || entry.data?.email || "";
                        const course =
                          entry.data?.course_code || entry.data?.course_title || "";
                        return (
                          <span
                            key={`${entry.row}-${email}-${course}`}
                            className={`inline-flex items-center gap-1.5 max-w-full px-2 py-1 rounded-lg border text-[10px] font-mono ${chipWrap}`}
                            title={[email, course].filter(Boolean).join(" · ")}
                          >
                            <span className={isVault ? "font-semibold text-stone-100" : "font-semibold text-stone-800"}>
                              R{entry.row}
                            </span>
                            {email && (
                              <span className={`truncate max-w-[120px] ${isVault ? "text-stone-500" : "text-stone-500"}`}>
                                {email}
                              </span>
                            )}
                          </span>
                        );
                      })}
                      {group.rows.length > 8 && (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-mono ${
                            isVault ? "bg-white/10 text-stone-500" : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          +{group.rows.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {errors.length === 0 && type === "enrollments" && (
        <p className={`text-[11px] font-mono text-center ${isVault ? "text-stone-500" : "text-stone-500"}`}>
          All enrollment rows were processed successfully.
        </p>
      )}
    </div>
  );
}

export default function BulkImportModal({
  isOpen,
  onClose,
  type,
  onImport,
  onDownloadSample,
  onImported,
}) {
  const { isVault } = useTheme();
  const config = BULK_IMPORT_CONFIG[type];
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setFile(null);
    setValidationError("");
    setIsDownloading(false);
    setIsUploading(false);
    setUploadProgress(0);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [isOpen]);

  const handleClose = () => {
    if (isUploading) return;
    onClose();
  };

  const handleFileChange = async (event) => {
    const nextFile = event.target.files?.[0] || null;
    setResult(null);
    setValidationError("");
    setFile(nextFile);

    if (!nextFile) return;

    const validation = await validateImportFileHeaders(
      nextFile,
      config.requiredHeaders,
      {
        optionalHeaders: config.optionalHeaders || [],
        requireOneOf: config.requireOneOf || [],
      }
    );
    if (!validation.ok) {
      setValidationError(validation.error);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDownloadSample = async (format) => {
    setIsDownloading(true);
    try {
      await onDownloadSample(format);
      toastSuccess(`Sample ${format.toUpperCase()} downloaded.`);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to download sample file."));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;

    const validation = await validateImportFileHeaders(
      file,
      config.requiredHeaders,
      {
        optionalHeaders: config.optionalHeaders || [],
        requireOneOf: config.requireOneOf || [],
      }
    );
    if (!validation.ok) {
      setValidationError(validation.error);
      return;
    }

    setIsUploading(true);
    setUploadProgress(12);
    setResult(null);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev >= 88 ? prev : prev + 8));
    }, 180);

    try {
      const response = await onImport(file);
      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = response?.data || response;
      setResult(data);
      onImported?.(data);

      const hasIssues = data?.failed_count > 0 || data?.skipped_count > 0;
      if (hasIssues && data?.success_count > 0) {
        toastSuccess(response?.message || "Import completed with some rows skipped or failed.");
      } else if (hasIssues) {
        toastError(response?.message || "Import completed with no new records created.");
      } else {
        toastSuccess(response?.message || "Import completed successfully.");
      }
    } catch (error) {
      clearInterval(progressTimer);
      setUploadProgress(0);
      toastError(getApiErrorMessage(error, "Unable to import file."));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!result?.errors?.length) return;
    const csv = buildErrorReportCsv(result.errors, type);
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      `${type}_import_errors.csv`
    );
  };

  const handleDownloadSkipped = () => {
    if (!result?.skipped?.length) return;
    const csv = buildSkippedReportCsv(result.skipped, type);
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      `${type}_import_skipped.csv`
    );
  };

  const handleImportAnother = () => {
    setResult(null);
    setFile(null);
    setValidationError("");
    setUploadProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Upload}
      title={result ? "Import Summary" : config.title}
      subtitle={
        result
          ? "Review the results of your bulk import."
          : config.subtitle
      }
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {result ? (
          <ImportSummary
            result={result}
            type={type}
            onDownloadErrors={handleDownloadErrors}
            onDownloadSkipped={result?.skipped?.length ? handleDownloadSkipped : null}
            isVault={isVault}
          />
        ) : (
          <>
            <div
              className={`rounded-xl border p-4 ${
                isVault ? "border-amber-500/20 bg-amber-500/10" : "border-amber-200/60 bg-amber-50/50"
              }`}
            >
              <p
                className={`text-[10px] font-mono uppercase tracking-wider font-semibold mb-2 ${
                  isVault ? "text-amber-400" : "text-amber-800"
                }`}
              >
                Instructions
              </p>
              <ul className="space-y-1.5">
                {config.instructions.map((item) => (
                  <li
                    key={item}
                    className={`text-xs font-light leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-amber-600 ${
                      isVault ? "text-stone-400" : "text-stone-600"
                    }`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleDownloadSample("csv")}
                disabled={isDownloading || isUploading}
                className={`flex-1 px-4 py-3 text-xs font-semibold font-mono rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
                  isVault
                    ? "bg-white/5 hover:bg-white/10 text-stone-300 border-stone-700/60"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Sample CSV
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSample("xlsx")}
                disabled={isDownloading || isUploading}
                className={`flex-1 px-4 py-3 text-xs font-semibold font-mono rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
                  isVault
                    ? "bg-white/5 hover:bg-white/10 text-stone-300 border-stone-700/60"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Sample XLSX
              </button>
            </div>

            <div>
              <label
                className={`text-[10px] font-mono block uppercase tracking-wider mb-1.5 font-semibold ${
                  isVault ? "text-stone-500" : "text-stone-450"
                }`}
              >
                Upload File
              </label>
              <label
                className={`flex flex-col items-center justify-center gap-2 w-full min-h-[140px] rounded-xl border border-dashed px-4 py-6 transition cursor-pointer ${
                  isUploading
                    ? isVault
                      ? "border-stone-700 bg-white/5 opacity-50 cursor-not-allowed"
                      : "border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed"
                    : isVault
                      ? "border-stone-700 bg-white/5 hover:border-amber-500/50 hover:bg-amber-500/10"
                      : "border-stone-300 bg-stone-50/70 hover:border-amber-500 hover:bg-amber-50/30"
                }`}
              >
                <FileUp className={`w-6 h-6 ${isVault ? "text-amber-400" : "text-amber-700"}`} />
                <span className={`text-xs font-mono text-center ${isVault ? "text-stone-300" : "text-stone-600"}`}>
                  {file ? file.name : "Choose CSV or XLSX file"}
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-wider ${isVault ? "text-stone-500" : "text-stone-400"}`}>
                  Max 5MB
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  disabled={isUploading}
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {validationError && (
              <div
                className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-xs ${
                  isVault ? "border-rose-500/20 bg-rose-500/10 text-rose-400" : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{validationError}</p>
              </div>
            )}

            {(isUploading || uploadProgress > 0) && (
              <div className="space-y-2">
                <div
                  className={`flex items-center justify-between text-[10px] font-mono uppercase tracking-wider ${
                    isVault ? "text-stone-500" : "text-stone-500"
                  }`}
                >
                  <span>{isUploading ? "Uploading..." : "Ready"}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isVault ? "bg-white/10" : "bg-stone-100"}`}>
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-800 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <div
          className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t ${
            isVault ? "border-stone-800" : "border-stone-100"
          }`}
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className={`px-4 py-3 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
              isVault
                ? "bg-stone-800/60 hover:bg-stone-800 text-stone-300 border-stone-700"
                : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Close
          </button>
          {result ? (
            <button
              type="button"
              onClick={handleImportAnother}
              className={`px-6 py-3 text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                isVault ? "bg-stone-700 hover:bg-stone-600" : "bg-stone-900 hover:bg-stone-800"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Import Another
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading || Boolean(validationError)}
              className={`px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                isVault ? "bg-stone-700 hover:bg-stone-600" : "bg-stone-900 hover:bg-stone-800"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Start Import
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
