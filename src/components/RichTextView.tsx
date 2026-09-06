"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import {
  richTextContentClass,
  richTextExtensions,
} from "./rich-text-extensions";

// Read-only rendering of a Tiptap document (SPEC rule 8: entry JSON is only
// ever rendered through Tiptap — never dangerouslySetInnerHTML). Client leaf;
// `immediatelyRender: false` is mandatory under Next SSR.
export function RichTextView({
  content,
  className,
}: {
  content: object;
  className?: string;
}) {
  const editor = useEditor({
    extensions: richTextExtensions,
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: richTextContentClass } },
  });

  return <EditorContent editor={editor} className={cn(className)} />;
}
