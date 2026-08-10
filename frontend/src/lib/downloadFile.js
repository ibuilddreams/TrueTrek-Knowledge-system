/**
 * Downloads a file by fetching its bytes and saving them via a blob: URL, rather than
 * navigating an <a download> straight to the (often cross-origin) source URL. Browsers
 * silently ignore the `download` attribute on cross-origin links in many cases, and a
 * plain navigation defers entirely to the server's Content-Disposition/MIME handling —
 * a blob URL is always same-origin and always forces a save, regardless of either.
 */
export async function downloadFile(url, filename) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file (status ${response.status})`);
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

export function getFilenameFromUrl(url, fallback) {
  try {
    const pathname = new URL(url).pathname;
    const base = decodeURIComponent(pathname.split("/").pop() || "");
    return base || fallback;
  } catch {
    return fallback;
  }
}
