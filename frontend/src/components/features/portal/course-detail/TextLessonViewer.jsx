"use client";

import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// DOMPurify's sanitize() touches `document`, so the HTML-format viewer can
// only run client-side (same reasoning already used for react-pdf/mammoth in
// DocumentLessonViewer.jsx).
const RichTextLessonViewer = dynamic(() => import("./RichTextLessonViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-32 animate-pulse rounded-cn-p border border-cn-p-line bg-cn-p-page" />
  ),
});

// The design's `.reader` scale: 16px body at 1.7, 19px section headings, a
// 22px list indent. Written as the markdown renderer's own components so an
// authored lesson reads as the design's article rather than as a form field.
const BODY = "text-base leading-[1.7] text-[#1F2937]";

function buildComponents() {
  return {
    h1: ({ children }) => (
      <h3 className="mt-7 mb-2.5 text-[19px] font-bold text-cn-p-ink first:mt-0">{children}</h3>
    ),
    h2: ({ children }) => (
      <h3 className="mt-7 mb-2.5 text-[19px] font-bold text-cn-p-ink first:mt-0">{children}</h3>
    ),
    h3: ({ children }) => (
      <h4 className="mt-6 mb-2 text-base font-bold text-cn-p-ink first:mt-0">{children}</h4>
    ),
    p: ({ children }) => <p className={`${BODY} mt-3 first:mt-0`}>{children}</p>,
    ul: ({ children }) => (
      <ul className={`${BODY} my-2 list-disc space-y-1 pl-[22px]`}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className={`${BODY} my-2 list-decimal space-y-1 pl-[22px]`}>{children}</ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-cn-p-ink">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-cn-p-accent underline underline-offset-2"
      >
        {children}
      </a>
    ),
    // The design's `.callout`: the one block that leaves the reader's prose
    // colour, because it is the line the lesson wants remembered.
    blockquote: ({ children }) => (
      <div className="my-6 rounded-xl bg-cn-p-soft px-[18px] py-4 font-medium text-cn-p-soft-ink">
        {children}
      </div>
    ),
    code: ({ children }) => (
      <code className="rounded border border-cn-p-line bg-cn-p-page px-1.5 py-0.5 font-mono text-sm text-cn-p-soft-ink">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="mt-3 overflow-x-auto rounded-cn-p-sm border border-cn-p-line bg-cn-p-page p-3 font-mono text-sm">
        {children}
      </pre>
    ),
    hr: () => <hr className="my-6 border-cn-p-line" />,
    table: ({ children }) => (
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm text-[#1F2937]">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="border-b border-cn-p-line">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-cn-p-line">{children}</tr>,
    th: ({ children }) => (
      <th className="px-3 py-2 text-left font-semibold text-cn-p-ink">{children}</th>
    ),
    td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
  };
}

// Some content_data (notably AI-generated lessons) is stored with literal
// "\n" escape sequences instead of real line breaks, which markdown treats
// as plain text rather than paragraph/line breaks. Normalize before render.
function normalizeLineBreaks(text) {
  return text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
}

export default function TextLessonViewer({ lesson }) {
  const rawContent = lesson.content_data || "";

  if (!rawContent || !rawContent.trim()) {
    return (
      <div className="rounded-cn-p border border-dashed border-cn-p-line bg-cn-p-page px-4 py-10 text-center">
        <p className="text-sm text-cn-p-ink-2">
          This lesson doesn&apos;t have any content yet.
        </p>
      </div>
    );
  }

  if (lesson.content_format === "HTML") {
    return <RichTextLessonViewer html={rawContent} />;
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={buildComponents()}>
      {normalizeLineBreaks(rawContent)}
    </ReactMarkdown>
  );
}
