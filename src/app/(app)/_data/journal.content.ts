import "server-only";
import type { TiptapDoc } from "./journal.schemas";

// Derives `contentText` from the Tiptap JSON (SPEC rule 4). Called by the
// service on EVERY write — the one write path — so the text can never drift
// from the document. Search and excerpts read this, never the JSON.

type Node = { type: string; text?: string; content?: Node[] };

const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "listItem",
  "blockquote",
  "codeBlock",
]);

export function extractText(doc: TiptapDoc): string {
  const parts: string[] = [];
  const walk = (node: Node) => {
    if (node.type === "text" && node.text) parts.push(node.text);
    if (node.type === "hardBreak") parts.push("\n");
    for (const child of node.content ?? []) walk(child);
    if (BLOCK_TYPES.has(node.type)) parts.push("\n");
  };
  walk(doc as Node);
  return parts
    .join("")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

/** First line-ish of the text for list rows; never cuts a word in half. */
export function excerptOf(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.lastIndexOf(" ", max);
  return `${flat.slice(0, cut > max / 2 ? cut : max)}…`;
}
