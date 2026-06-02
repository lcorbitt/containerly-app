import type { JSONContent } from "@tiptap/core";
import {
  parseMessageMarkup,
  serializeMessageMarkup,
  type MessageMarkupInlineNode,
} from "@/utils/message-markup";

type TipTapMark = { type: string };

function messageMarkupNodesToTiptapContent(nodes: MessageMarkupInlineNode[]): JSONContent[] {
  const out: JSONContent[] = [];
  for (const node of nodes) {
    if (node.type === "text") {
      if (node.value) out.push({ type: "text", text: node.value });
      continue;
    }
    if (node.type === "code") {
      out.push({
        type: "text",
        text: node.value,
        marks: [{ type: "code" }],
      });
      continue;
    }
    const markType =
      node.type === "bold"
        ? "bold"
        : node.type === "italic"
          ? "italic"
          : node.type === "underline"
            ? "underline"
            : node.type === "strike"
              ? "strike"
              : null;
    if (!markType) continue;
    const inner = messageMarkupNodesToTiptapContent(node.children);
    for (const piece of inner) {
      if (piece.type !== "text") {
        out.push(piece);
        continue;
      }
      const marks = [...(piece.marks ?? []), { type: markType }];
      out.push({ ...piece, marks });
    }
  }
  return out;
}

export function messageMarkupToTiptapDoc(markdown: string): JSONContent {
  const lines = markdown.split("\n");
  const content: JSONContent[] = lines.map((line) => ({
    type: "paragraph",
    content: line ? messageMarkupNodesToTiptapContent(parseMessageMarkup(line)) : [],
  }));
  if (content.length === 0) {
    content.push({ type: "paragraph" });
  }
  return { type: "doc", content };
}

function tiptapTextWithMarks(text: string, marks: TipTapMark[] | undefined): string {
  const types = new Set((marks ?? []).map((m) => m.type));
  if (types.has("code")) {
    return `\`${text.replace(/\\/g, "\\\\").replace(/`/g, "\\`")}\``;
  }
  let out = text.replace(/\\/g, "\\\\").replace(/([*_~])/g, "\\$1");
  if (types.has("bold")) out = `**${out}**`;
  if (types.has("italic")) out = `*${out}*`;
  if (types.has("underline")) out = `__${out}__`;
  if (types.has("strike")) out = `~~${out}~~`;
  return out;
}

function serializeTiptapInline(content: JSONContent[] | undefined): string {
  if (!content?.length) return "";
  return content
    .map((node) => {
      if (node.type === "hardBreak") return "\n";
      if (node.type === "text" && typeof node.text === "string") {
        return tiptapTextWithMarks(node.text, node.marks as TipTapMark[] | undefined);
      }
      return "";
    })
    .join("");
}

/** Serialize TipTap document JSON to stored message markup. */
export function tiptapDocToMessageMarkup(doc: JSONContent): string {
  const blocks = doc.content ?? [];
  const lines = blocks.map((block) => {
    if (block.type === "paragraph") {
      return serializeTiptapInline(block.content);
    }
    return "";
  });
  const joined = lines.join("\n");
  return joined.trim() ? joined : "";
}

/** Round-trip helper for tests. */
export function messageMarkupRoundTrip(input: string): string {
  return serializeMessageMarkup(parseMessageMarkup(input));
}
