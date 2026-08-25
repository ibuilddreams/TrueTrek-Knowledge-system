"use client";

import DOMPurify from "dompurify";

// Keep this allowlist in sync with backend/lessons/sanitize.py's nh3 config —
// the two are independent and neither warns the other on drift. This is
// defense-in-depth: the backend is the authoritative sanitizer, this guards
// dangerouslySetInnerHTML against any content that predates it or bypassed it.
const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3",
  "strong", "em", "u", "s",
  "ul", "ol", "li",
  "a", "blockquote", "code", "pre", "hr", "br",
  "table", "thead", "tbody", "tr", "th", "td",
];
const ALLOWED_ATTR = ["href", "colspan", "rowspan"];

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("rel", "noopener noreferrer nofollow");
    node.setAttribute("target", "_blank");
  }
});

export default function RichTextLessonViewer({ html, isVault }) {
  const clean = DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });

  return (
    <div
      className={`rounded-2xl border px-5 py-5 lesson-rich-text ${
        isVault ? "lesson-rich-text--vault border-stone-800 bg-[#0c0b0a]" : "border-stone-200 bg-stone-50"
      }`}
      // eslint-disable-next-line react/no-danger -- sanitized above via DOMPurify
      // with an explicit tag/attribute allowlist mirroring the backend's nh3 pass.
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
