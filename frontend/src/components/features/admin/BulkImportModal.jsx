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

function ImportSummary({ result, type, onDownloadErrors, onDownloadSkipped }) {
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
      wrap: "border-cn-p-ok-bg bg-cn-p-ok-bg",
      iconWrap: "bg-cn-p-ok-bg text-cn-p-ok",
      labelClass: "text-cn-p-ok",
      detailClass: "text-cn-p-ok",
    },
    partial: {
      icon: AlertTriangle,
      label: "Import completed with some rows skipped or failed",
      detail: `${success} created, ${skipped} skipped as duplicates, ${failed} failed. Review the details below.`,
      wrap: "border-cn-p-soft bg-cn-p-soft",
      iconWrap: "bg-cn-p-soft text-cn-p-soft-ink",
      labelClass: "text-cn-p-soft-ink",
      detailClass: "text-cn-p-soft-ink",
    },
    failed: {
      icon: XCircle,
      label: "Import finished with no new records created",
      detail:
        skipped > 0 && failed === 0
          ? `All ${skipped} row${skipped === 1 ? "" : "s"} matched existing accounts and were skipped.`
          : `All ${total} row${total === 1 ? "" : "s"} were skipped or failed. Review the details below.`,
      wrap: "border-cn-p-bad-bg bg-cn-p-bad-bg",
      iconWrap: "bg-cn-p-bad-bg text-cn-p-bad",
      labelClass: "text-cn-p-bad",
      detailClass: "text-cn-p-bad",
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

  const cardWrap = "border-cn-p-line bg-cn-p-card";
  const cardHeaderWrap = "border-cn-p-line bg-cn-p-page";
  const mutedLabel = "text-cn-p-ink-2";
  const mutedText = "text-cn-p-ink-2";
  const chipWrap = "bg-cn-p-page border-cn-p-line text-cn-p-ink-2";
  const divideClass = "divide-cn-p-line";

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${outcomeMeta.wrap}`}>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${outcomeMeta.iconWrap}`}
        >
          <OutcomeIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-bold leading-tight ${outcomeMeta.labelClass}`}>
            {outcomeMeta.label}
          </p>
          <p className={`text-sm mt-1 leading-relaxed ${outcomeMeta.detailClass}`}>
            {outcomeMeta.detail}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        <div className={`rounded-2xl border p-3.5 ${cardWrap}`}>
          <p className={`text-[11px] font-semibold ${mutedLabel}`}>
            Total
          </p>
          <p className="text-2xl font-bold mt-1 tabular-nums text-cn-p-ink">
            {total}
          </p>
        </div>
        <div className="rounded-2xl border p-3.5 border-cn-p-ok-bg bg-cn-p-ok-bg">
          <p className="text-[11px] font-semibold text-cn-p-ok">
            Created
          </p>
          <p className="text-2xl font-bold mt-1 tabular-nums text-cn-p-ok">
            {success}
          </p>
        </div>
        <div className="rounded-2xl border p-3.5 border-cn-p-soft bg-cn-p-soft">
          <p className="text-[11px] font-semibold text-cn-p-soft-ink">
            Skipped
          </p>
          <p className="text-2xl font-bold mt-1 tabular-nums text-cn-p-soft-ink">
            {skipped}
          </p>
        </div>
        <div className="rounded-2xl border p-3.5 border-cn-p-bad-bg bg-cn-p-bad-bg">
          <p className="text-[11px] font-semibold text-cn-p-bad">
            Failed
          </p>
          <p className="text-2xl font-bold mt-1 tabular-nums text-cn-p-bad">
            {failed}
          </p>
        </div>
      </div>

      <div className={`rounded-2xl border p-3.5 space-y-2 ${cardWrap}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-cn-p-ink-2">
            Success rate
          </p>
          <p className="text-sm font-semibold tabular-nums text-cn-p-ink-2">
            {successRate}%
          </p>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden bg-cn-p-page">
          <div
            className={`h-full rounded-full transition-all duration-500 ${ outcome === "failed" ? "bg-cn-p-bad" : outcome === "partial" ? "bg-cn-p-ok" : "bg-cn-p-ok" }`}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {skippedRows.length > 0 && (
        <div className={`rounded-2xl border overflow-hidden ${cardWrap}`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${cardHeaderWrap}`}>
            <div>
              <p className={`text-[11px] font-semibold ${mutedLabel}`}>
                Skipped duplicates
              </p>
              <p className={`text-xs mt-0.5 ${mutedText}`}>
                {skippedRows.length} row{skippedRows.length === 1 ? "" : "s"} already existed and{" "}
                {skippedRows.length === 1 ? "was" : "were"} left unchanged.
              </p>
            </div>
            {onDownloadSkipped && (
              <button
                type="button"
                onClick={onDownloadSkipped}
                className="shrink-0 px-3 py-2 rounded-lg border text-[11px] font-semibold transition flex items-center gap-1.5 border-cn-p-soft bg-cn-p-soft hover:bg-cn-p-soft text-cn-p-soft-ink"
              >
                <Download className="w-3 h-3" />
                Skipped report
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
                  <div className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 bg-cn-p-soft border-cn-p-soft text-cn-p-soft-ink">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-cn-p-ink">
                        {display.title}
                      </p>
                      <p className="text-xs mt-0.5 truncate text-cn-p-ink-2">
                        {display.subtitle}
                      </p>
                      <p className="text-xs mt-0.5 truncate text-cn-p-soft-ink">
                        {entry.reason}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-cn-p-soft border border-cn-p-soft text-cn-p-soft-ink">
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
              <p className={`text-[11px] font-semibold ${mutedLabel}`}>
                Row errors
              </p>
              <p className={`text-xs mt-0.5 ${mutedText}`}>
                {errors.length} failed row{errors.length === 1 ? "" : "s"} · {groupedErrors.length}{" "}
                issue type{groupedErrors.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={onDownloadErrors}
              className="shrink-0 px-3 py-2 rounded-lg border text-[11px] font-semibold transition flex items-center gap-1.5 border-cn-p-soft bg-cn-p-soft hover:bg-cn-p-soft text-cn-p-soft-ink"
            >
              <Download className="w-3 h-3" />
              Error report
            </button>
          </div>

          <div className={`max-h-56 overflow-y-auto divide-y ${divideClass}`}>
            {groupedErrors.map((group) => (
              <div key={group.message} className="px-4 py-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 bg-cn-p-bad-bg border-cn-p-bad-bg text-cn-p-bad">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-relaxed text-cn-p-bad">
                        {group.message}
                      </p>
                      <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-cn-p-bad-bg border border-cn-p-bad-bg text-cn-p-bad">
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
                            className={`inline-flex items-center gap-1.5 max-w-full px-2 py-1 rounded-lg border text-[11px] ${chipWrap}`}
                            title={[email, course].filter(Boolean).join(" · ")}
                          >
                            <span className="font-semibold text-cn-p-ink">
                              R{entry.row}
                            </span>
                            {email && (
                              <span className="truncate max-w-[120px] text-cn-p-ink-2">
                                {email}
                              </span>
                            )}
                          </span>
                        );
                      })}
                      {group.rows.length > 8 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] bg-cn-p-page text-cn-p-ink-2">
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
        <p className="text-xs text-center text-cn-p-ink-2">
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
      title={result ? "Import summary" : config.title}
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
          />
        ) : (
          <>
            <div className="rounded-xl border p-4 border-cn-p-soft bg-cn-p-soft">
              <p className="text-[11px] font-semibold mb-2 text-cn-p-soft-ink">
                Instructions
              </p>
              <ul className="space-y-1.5">
                {config.instructions.map((item) => (
                  <li
                    key={item}
                    className="text-sm font-light leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-cn-p-accent text-cn-p-ink-2"
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
                className="flex-1 px-4 py-3 text-sm font-semibold rounded-cn-p-sm transition-all flex items-center justify-center gap-2 border disabled:opacity-60 disabled:cursor-not-allowed bg-transparent hover:bg-cn-p-page text-cn-p-ink border-cn-p-line"
              >
                <Download className="w-3.5 h-3.5" />
                Sample CSV
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSample("xlsx")}
                disabled={isDownloading || isUploading}
                className="flex-1 px-4 py-3 text-sm font-semibold rounded-cn-p-sm transition-all flex items-center justify-center gap-2 border disabled:opacity-60 disabled:cursor-not-allowed bg-transparent hover:bg-cn-p-page text-cn-p-ink border-cn-p-line"
              >
                <Download className="w-3.5 h-3.5" />
                Sample XLSX
              </button>
            </div>

            <div>
              <label className="text-[11px] block mb-1.5 font-semibold text-cn-p-ink-2">
                Upload file
              </label>
              <label
                className={`flex flex-col items-center justify-center gap-2 w-full min-h-[140px] rounded-xl border border-dashed px-4 py-6 transition cursor-pointer ${ isUploading ? "border-cn-p-line bg-cn-p-page opacity-60 cursor-not-allowed" : "border-cn-p-line bg-cn-p-page hover:border-cn-p-accent hover:bg-cn-p-page" }`}
              >
                <FileUp className="w-6 h-6 text-cn-p-soft-ink" />
                <span className="text-sm text-center text-cn-p-ink-2">
                  {file ? file.name : "Choose CSV or XLSX file"}
                </span>
                <span className="text-[11px] text-cn-p-ink-2">
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
              <div className="flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm border-cn-p-bad-bg bg-cn-p-bad-bg text-cn-p-bad">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{validationError}</p>
              </div>
            )}

            {(isUploading || uploadProgress > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-cn-p-ink-2">
                  <span>{isUploading ? "Uploading..." : "Ready"}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-cn-p-page">
                  <div
                    className="h-full bg-cn-p-accent transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-cn-p-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-3 text-sm font-semibold rounded-cn-p-sm transition-all flex items-center justify-center gap-2 border disabled:opacity-60 disabled:cursor-not-allowed bg-transparent hover:bg-cn-p-page text-cn-p-ink border-cn-p-line"
          >
            <X className="w-3.5 h-3.5" />
            Close
          </button>
          {result ? (
            <button
              type="button"
              onClick={handleImportAnother}
              className="px-6 py-3 text-white text-sm font-semibold rounded-cn-p-sm transition-all flex items-center justify-center gap-2 bg-cn-p-accent hover:bg-cn-p-accent-hover"
            >
              <Upload className="w-3.5 h-3.5" />
              Import another
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading || Boolean(validationError)}
              className="px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-cn-p-sm transition-all flex items-center justify-center gap-2 bg-cn-p-accent hover:bg-cn-p-accent-hover"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Start import
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
