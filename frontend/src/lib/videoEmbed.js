const IFRAME_SRC_PATTERN = /<iframe[^>]*\ssrc=["']([^"']+)["']/i;

export function isIframeEmbedCode(value) {
  return typeof value === "string" && /<iframe/i.test(value);
}

export function extractIframeSrc(html) {
  if (typeof html !== "string") return null;
  const match = html.match(IFRAME_SRC_PATTERN);
  return match ? match[1] : null;
}

export function getVideoEmbedUrl(input) {
  if (!input) return null;
  const trimmed = typeof input === "string" ? input.trim() : input;
  const candidate = isIframeEmbedCode(trimmed) ? extractIframeSrc(trimmed) : trimmed;
  if (!candidate) return null;

  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;

      const shortsMatch = parsed.pathname.match(/\/shorts\/([\w-]+)/);
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;

      const embedMatch = parsed.pathname.match(/\/embed\/([\w-]+)/);
      if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;

      return null;
    }

    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === "vimeo.com") {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    if (host === "player.vimeo.com") {
      const embedMatch = parsed.pathname.match(/\/video\/([\w-]+)/);
      return embedMatch ? `https://player.vimeo.com/video/${embedMatch[1]}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Normalizes whatever a user pastes into a "Video URL" field: if it's a raw
 * `<iframe>` embed snippet, extract and normalize its `src`; otherwise
 * return the value unchanged (so plain typing/pasting of a URL still works
 * as-is, including partial URLs while the user is still typing).
 */
export function normalizePastedVideoInput(value) {
  if (!isIframeEmbedCode(value)) return value;
  return getVideoEmbedUrl(value) || value;
}
