"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import {
  richTextContentClass,
  richTextExtensions,
} from "./rich-text-extensions";

type Props = {
  name: string;
  label?: string;
  disabled?: boolean;
  containerClassName?: string;
};

// Shared RHF field (UI.md §7): a Tiptap editor bound via Controller. The form
// value is the Tiptap document JSON (the schema's z.input shape); the editor
// instance never escapes this component. Content is read from the form value
// once on mount — callers remount with `key={date}` to load another day.
// `immediatelyRender: false` is mandatory under Next SSR (SPEC version facts).
export function RHFRichText({
  name,
  label,
  disabled,
  containerClassName,
}: Props) {
  const labelId = useId();
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn("space-y-2", containerClassName)}>
          {label && <Label id={labelId}>{label}</Label>}
          <RichTextEditor
            initialContent={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            invalid={!!fieldState.error}
            labelId={label ? labelId : undefined}
          />
          {fieldState.error?.message && (
            <p className="text-sm text-destructive">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}

// Toolbar exposes exactly bold, italic, bullet list, ordered list (SPEC); the
// shared extension set switches everything else off so shortcuts and
// markdown-style input rules can't create nodes the toolbar doesn't show.
function RichTextEditor({
  initialContent,
  onChange,
  onBlur,
  disabled,
  invalid,
  labelId,
}: {
  initialContent: object;
  onChange: (doc: object) => void;
  onBlur: () => void;
  disabled?: boolean;
  invalid: boolean;
  labelId?: string;
}) {
  const editor = useEditor({
    extensions: richTextExtensions,
    content: initialContent,
    immediatelyRender: false,
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    onBlur,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        ...(labelId && { "aria-labelledby": labelId }),
        "aria-invalid": String(invalid),
        class: cn("min-h-48 px-3 py-2 outline-none", richTextContentClass),
      },
    },
  });

  return (
    <div
      className={cn(
        "rounded-lg border border-input bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        invalid && "border-destructive ring-destructive/20 dark:ring-destructive/40",
        disabled && "opacity-50",
      )}
    >
      <Toolbar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  // Subscribes to just the four booleans the toolbar renders, so typing
  // doesn't re-render the whole field on every transaction.
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
    }),
  });

  const items = [
    { key: "bold", label: "Bold", icon: Bold, run: () => editor?.chain().focus().toggleBold().run() },
    { key: "italic", label: "Italic", icon: Italic, run: () => editor?.chain().focus().toggleItalic().run() },
    { key: "bulletList", label: "Bullet list", icon: List, run: () => editor?.chain().focus().toggleBulletList().run() },
    { key: "orderedList", label: "Numbered list", icon: ListOrdered, run: () => editor?.chain().focus().toggleOrderedList().run() },
  ] as const;

  return (
    <div role="toolbar" aria-label="Formatting" className="flex gap-1 border-b border-input p-1">
      {items.map(({ key, label, icon: Icon, run }) => (
        <Toggle
          key={key}
          size="sm"
          aria-label={label}
          pressed={active?.[key] ?? false}
          onPressedChange={run}
          disabled={disabled || !editor}
          // Keep focus in the editor: the press applies to the current selection.
          onMouseDown={(event) => event.preventDefault()}
        >
          <Icon />
        </Toggle>
      ))}
    </div>
  );
}
