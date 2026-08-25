"use client";

import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "@/hooks/useTheme";

// DOMPurify's sanitize() touches `document`, so the HTML-format viewer can
// only run client-side (same reasoning already used for react-pdf/mammoth in
// DocumentLessonViewer.jsx).
const RichTextLessonViewer = dynamic(() => import("./RichTextLessonViewer"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 h-32 animate-pulse" />
  ),
});

function buildComponents(isVault) {
  const heading = isVault ? "text-stone-50" : "text-stone-900";
  const body = isVault ? "text-stone-300" : "text-stone-600";
  const muted = isVault ? "text-stone-400" : "text-stone-500";
  const link = isVault
    ? "text-amber-400 hover:text-amber-300"
    : "text-amber-700 hover:text-amber-800";
  const code = isVault
    ? "bg-white/5 text-amber-300 border-stone-800"
    : "bg-stone-100 text-amber-700 border-stone-200";
  const quoteBorder = isVault ? "border-amber-600/40" : "border-amber-300";

  return {
    h1: ({ children }) => (
      <h1 className={`font-serif font-bold text-xl mt-6 mb-3 first:mt-0 ${heading}`}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className={`font-serif font-bold text-lg mt-5 mb-2.5 first:mt-0 ${heading}`}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className={`font-serif font-semibold text-base mt-4 mb-2 first:mt-0 ${heading}`}>
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className={`text-sm font-light leading-relaxed mb-3 last:mb-0 ${body}`}>{children}</p>
    ),
    ul: ({ children }) => (
      <ul className={`list-disc pl-5 space-y-1.5 mb-3 text-sm font-light leading-relaxed ${body}`}>
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol
        className={`list-decimal pl-5 space-y-1.5 mb-3 text-sm font-light leading-relaxed ${body}`}
      >
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => (
      <strong className={`font-semibold ${isVault ? "text-stone-100" : "text-stone-800"}`}>
        {children}
      </strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline underline-offset-2 ${link}`}
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className={`border-l-2 pl-4 my-3 italic ${quoteBorder} ${muted}`}>
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className={`px-1.5 py-0.5 rounded border text-xs font-mono ${code}`}>{children}</code>
    ),
    pre: ({ children }) => (
      <pre
        className={`rounded-lg border p-3 mb-3 overflow-x-auto text-xs font-mono ${code}`}
      >
        {children}
      </pre>
    ),
    hr: () => <hr className={`my-4 ${isVault ? "border-stone-800" : "border-stone-200"}`} />,
    table: ({ children }) => (
      <div className="overflow-x-auto mb-3">
        <table className={`w-full text-sm border-collapse ${body}`}>{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className={isVault ? "border-b border-stone-700" : "border-b border-stone-300"}>
        {children}
      </thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className={isVault ? "border-b border-stone-800" : "border-b border-stone-200"}>{children}</tr>
    ),
    th: ({ children }) => (
      <th className={`px-3 py-2 text-left font-semibold ${isVault ? "text-stone-100" : "text-stone-800"}`}>
        {children}
      </th>
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
  const { isVault } = useTheme();
  const rawContent = lesson.content_data || "";

  if (!rawContent || !rawContent.trim()) {
    return (
      <div
        className={`rounded-2xl border border-dashed px-4 py-10 text-center ${
          isVault ? "border-stone-700 bg-white/5" : "border-stone-200 bg-stone-50"
        }`}
      >
        <p className={`text-xs ${isVault ? "text-stone-400" : "text-stone-500"}`}>
          This lesson doesn&apos;t have any content yet.
        </p>
      </div>
    );
  }

  if (lesson.content_format === "HTML") {
    return <RichTextLessonViewer html={rawContent} isVault={isVault} />;
  }

  const content = normalizeLineBreaks(rawContent);

  return (
    <div
      className={`rounded-2xl border px-5 py-5 ${
        isVault ? "border-stone-800 bg-[#0c0b0a]" : "border-stone-200 bg-stone-50"
      }`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={buildComponents(isVault)}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
