"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  BULK_IMPORT_CONFIG,
  buildErrorReportCsv,
  downloadBlob,
  validateImportFileHeaders,
} from "@/lib/bulkImport";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

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

      if (data?.failed_count > 0 && data?.success_count > 0) {
        toastSuccess(response?.message || "Import completed with some failures.");
      } else if (data?.failed_count > 0) {
        toastError(response?.message || "Import completed with failures.");
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Upload}
      title={config.title}
      subtitle={config.subtitle}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-semibold mb-2">
            Instructions
          </p>
          <ul className="space-y-1.5">
            {config.instructions.map((item) => (
              <li
                key={item}
                className="text-xs text-stone-600 font-light leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-amber-600"
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
            className="flex-1 px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Sample CSV
          </button>
          <button
            type="button"
            onClick={() => handleDownloadSample("xlsx")}
            disabled={isDownloading || isUploading}
            className="flex-1 px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Sample XLSX
          </button>
        </div>

        <div>
          <label className="text-[10px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold">
            Upload File
          </label>
          <label
            className={`flex flex-col items-center justify-center gap-2 w-full min-h-[140px] rounded-xl border border-dashed px-4 py-6 transition cursor-pointer ${
              isUploading
                ? "border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed"
                : "border-stone-300 bg-stone-50/70 hover:border-amber-500 hover:bg-amber-50/30"
            }`}
          >
            <FileUp className="w-6 h-6 text-amber-700" />
            <span className="text-xs font-mono text-stone-600 text-center">
              {file ? file.name : "Choose CSV or XLSX file"}
            </span>
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
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
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{validationError}</p>
          </div>
        )}

        {(isUploading || uploadProgress > 0) && !result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-500">
              <span>{isUploading ? "Uploading..." : "Ready"}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-800 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-semibold text-stone-800 font-mono uppercase tracking-wider">
                Import Summary
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white border border-stone-200 p-3 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Total</p>
                <p className="text-lg font-serif font-bold text-stone-900">{result.total_rows || 0}</p>
              </div>
              <div className="rounded-lg bg-white border border-emerald-100 p-3 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-600">Success</p>
                <p className="text-lg font-serif font-bold text-emerald-700">{result.success_count || 0}</p>
              </div>
              <div className="rounded-lg bg-white border border-rose-100 p-3 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-rose-600">Failed</p>
                <p className="text-lg font-serif font-bold text-rose-700">{result.failed_count || 0}</p>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
                    Row Errors
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadErrors}
                    className="text-[10px] font-mono uppercase tracking-wider text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Error Report
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-stone-200 bg-white divide-y divide-stone-100">
                  {result.errors.map((entry) => (
                    <div key={`${entry.row}-${entry.error}`} className="px-3 py-2.5">
                      <p className="text-[11px] font-mono text-stone-500">Row {entry.row}</p>
                      <p className="text-xs text-rose-700 mt-0.5">{entry.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading || Boolean(validationError)}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2"
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
