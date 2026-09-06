import StarterKit from "@tiptap/starter-kit";

// The one Tiptap extension set for the app (SPEC: bold, italic, bullet list,
// ordered list — nothing more). Shared by the editor (RHFRichText) and the
// read-only view (RichTextView) so a document always renders the same way.
export const richTextExtensions = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    code: false,
    codeBlock: false,
    strike: false,
    underline: false,
    link: false,
    horizontalRule: false,
  }),
];

// Tailwind resets list styles; restore them inside Tiptap content only.
export const richTextContentClass =
  "text-base sm:text-sm [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-6";
