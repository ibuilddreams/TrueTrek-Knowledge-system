"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Unlink,
  Table2,
  Undo2,
  Redo2,
  Minus,
  Check,
  X,
} from "lucide-react";

function ToolbarButton({ onClick, isActive, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
        isActive
          ? "bg-stone-900 text-white border-stone-900"
          : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Write the lesson content...",
}) {
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-text-editor-content",
      },
    },
  });

  // Keeps the editor in sync when `value` changes for a reason other than the
  // user typing (e.g. the parent modal switching from "create" to "edit" and
  // hydrating a different lesson's content into the same mounted instance).
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const incoming = value || "";
    if (editor.getHTML() !== incoming) {
      editor.commands.setContent(incoming, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  const openLinkInput = () => {
    setLinkValue(editor.getAttributes("link").href || "");
    setLinkInputOpen(true);
  };

  const applyLink = () => {
    const url = linkValue.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkInputOpen(false);
    setLinkValue("");
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden focus-within:border-amber-600 transition">
      <div className="flex flex-wrap items-center gap-1 px-2.5 py-2 border-b border-stone-200 bg-white">
        <ToolbarButton
          title="Heading 1"
          isActive={editor.isActive("heading", { level: 1 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          isActive={editor.isActive("heading", { level: 2 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          isActive={editor.isActive("heading", { level: 3 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <span className="w-px h-5 bg-stone-200 mx-1" />

        <ToolbarButton
          title="Bold"
          isActive={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          isActive={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          isActive={editor.isActive("underline")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          isActive={editor.isActive("strike")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarButton>

        <span className="w-px h-5 bg-stone-200 mx-1" />

        <ToolbarButton
          title="Bullet list"
          isActive={editor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          isActive={editor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Blockquote"
          isActive={editor.isActive("blockquote")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>

        <span className="w-px h-5 bg-stone-200 mx-1" />

        <ToolbarButton title="Link" isActive={editor.isActive("link")} disabled={disabled} onClick={openLinkInput}>
          <Link2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton
            title="Remove link"
            disabled={disabled}
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Unlink className="w-3.5 h-3.5" />
          </ToolbarButton>
        )}
        <ToolbarButton
          title="Insert table"
          disabled={disabled}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Table2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Horizontal rule"
          disabled={disabled}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="w-3.5 h-3.5" />
        </ToolbarButton>

        <span className="w-px h-5 bg-stone-200 mx-1" />

        <ToolbarButton title="Undo" disabled={disabled || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Redo" disabled={disabled || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>

      {linkInputOpen && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-200 bg-amber-50/60">
          <input
            type="text"
            autoFocus
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              } else if (event.key === "Escape") {
                setLinkInputOpen(false);
              }
            }}
            placeholder="https://example.com"
            className="flex-1 px-2.5 py-1.5 bg-white border border-stone-200 focus:border-amber-600 focus:outline-none rounded-lg text-xs font-mono text-stone-850 placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={applyLink}
            className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-stone-900 text-white hover:bg-stone-800 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setLinkInputOpen(false)}
            className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="px-4 py-3 max-h-96 overflow-y-auto text-xs" />
    </div>
  );
}
