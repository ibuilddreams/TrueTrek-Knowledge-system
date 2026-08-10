"use client";

import { useState } from "react";
import { downloadFile } from "@/lib/downloadFile";
import { toastError } from "@/lib/toast";

export function useFileDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  async function download(url, filename) {
    if (!url || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadFile(url, filename);
    } catch {
      toastError("Unable to download this file. Try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return { download, isDownloading };
}
