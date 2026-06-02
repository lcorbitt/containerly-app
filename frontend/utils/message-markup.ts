/** Discord-style inline markup stored in `report_messages.body`. */

export interface MessageMarkupTextNode {
  type: "text";
  value: string;
}

export interface MessageMarkupBoldNode {
  type: "bold";
  children: MessageMarkupInlineNode[];
}

export interface MessageMarkupItalicNode {
  type: "italic";
  children: MessageMarkupInlineNode[];
}

export interface MessageMarkupUnderlineNode {
  type: "underline";
  children: MessageMarkupInlineNode[];
}

export interface MessageMarkupStrikeNode {
  type: "strike";
  children: MessageMarkupInlineNode[];
}

export interface MessageMarkupCodeNode {
  type: "code";
  value: string;
}

export type MessageMarkupInlineNode =
  | MessageMarkupTextNode
  | MessageMarkupBoldNode
  | MessageMarkupItalicNode
  | MessageMarkupUnderlineNode
  | MessageMarkupStrikeNode
  | MessageMarkupCodeNode;

type MarkKind = "bold" | "italic" | "underline" | "strike";

const MARK_DELIMITERS: Record<MarkKind, [string, string]> = {
  bold: ["**", "**"],
  underline: ["__", "__"],
  strike: ["~~", "~~"],
  italic: ["*", "*"],
};

const MARK_OPENERS: { kind: MarkKind; open: string; close: string }[] = [
  { kind: "bold", open: "**", close: "**" },
  { kind: "underline", open: "__", close: "__" },
  { kind: "strike", open: "~~", close: "~~" },
  { kind: "italic", open: "*", close: "*" },
];

function isEscaped(input: string, index: number): boolean {
  let slashes = 0;
  for (let i = index - 1; i >= 0 && input[i] === "\\"; i -= 1) {
    slashes += 1;
  }
  return slashes % 2 === 1;
}

function readPlainText(input: string, start: number): { value: string; next: number } {
  let value = "";
  let i = start;
  while (i < input.length) {
    const ch = input[i]!;
    if (ch === "\\" && i + 1 < input.length) {
      const next = input[i + 1]!;
      if ("*_~`\\".includes(next)) {
        value += next;
        i += 2;
        continue;
      }
    }
    if (ch === "`") break;
    let matched = false;
    for (const mark of MARK_OPENERS) {
      if (input.startsWith(mark.open, i) && !isEscaped(input, i)) {
        matched = true;
        break;
      }
    }
    if (matched) break;
    value += ch;
    i += 1;
  }
  return { value, next: i };
}

function readCodeSpan(input: string, start: number): { node: MessageMarkupCodeNode | null; next: number } {
  if (input[start] !== "`" || isEscaped(input, start)) {
    return { node: null, next: start };
  }
  let i = start + 1;
  let value = "";
  while (i < input.length) {
    if (input[i] === "`" && !isEscaped(input, i)) {
      return { node: { type: "code", value }, next: i + 1 };
    }
    if (input[i] === "\\" && i + 1 < input.length) {
      value += input[i + 1];
      i += 2;
      continue;
    }
    value += input[i]!;
    i += 1;
  }
  return { node: null, next: start };
}

function readMarkedSpan(
  input: string,
  start: number,
  kind: MarkKind,
): { node: MessageMarkupInlineNode | null; next: number } {
  const [open, close] = MARK_DELIMITERS[kind];
  if (!input.startsWith(open, start) || isEscaped(input, start)) {
    return { node: null, next: start };
  }
  const innerStart = start + open.length;
  const closeIndex = findClosingDelimiter(input, innerStart, close);
  if (closeIndex < 0) {
    return { node: null, next: start };
  }
  const children = parseMessageMarkupInline(input.slice(innerStart, closeIndex));
  if (children.length === 0) {
    return { node: null, next: start };
  }
  const node = { type: kind, children } as MessageMarkupInlineNode;
  return { node, next: closeIndex + close.length };
}

function findClosingDelimiter(input: string, from: number, close: string): number {
  for (let i = from; i < input.length; i += 1) {
    if (input.startsWith(close, i) && !isEscaped(input, i)) {
      return i;
    }
  }
  return -1;
}

function parseMessageMarkupInline(input: string): MessageMarkupInlineNode[] {
  const nodes: MessageMarkupInlineNode[] = [];
  let i = 0;

  while (i < input.length) {
    const code = readCodeSpan(input, i);
    if (code.node) {
      nodes.push(code.node);
      i = code.next;
      continue;
    }

    let matched = false;
    for (const mark of MARK_OPENERS) {
      const span = readMarkedSpan(input, i, mark.kind);
      if (span.node) {
        nodes.push(span.node);
        i = span.next;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const plain = readPlainText(input, i);
    if (plain.value) {
      nodes.push({ type: "text", value: plain.value });
    }
    i = plain.next === i ? i + 1 : plain.next;
  }

  return mergeAdjacentTextNodes(nodes);
}

function mergeAdjacentTextNodes(nodes: MessageMarkupInlineNode[]): MessageMarkupInlineNode[] {
  const out: MessageMarkupInlineNode[] = [];
  for (const node of nodes) {
    const prev = out[out.length - 1];
    if (node.type === "text" && prev?.type === "text") {
      prev.value += node.value;
    } else {
      out.push(node);
    }
  }
  return out;
}

/** Parse stored message body into an inline AST (preserves newlines in text nodes). */
export function parseMessageMarkup(input: string): MessageMarkupInlineNode[] {
  if (!input) return [];
  return parseMessageMarkupInline(input);
}

function inlineNodesToPlainText(nodes: MessageMarkupInlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.value;
      if (node.type === "code") return node.value;
      return inlineNodesToPlainText(node.children);
    })
    .join("");
}

/** Plain text for previews, notifications, and search. */
export function stripMessageMarkup(input: string): string {
  return inlineNodesToPlainText(parseMessageMarkup(input));
}

function escapePlainText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/([*_~`])/g, "\\$1");
}

function escapeCodeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

function serializeInlineNodes(nodes: MessageMarkupInlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return escapePlainText(node.value);
      if (node.type === "code") return `\`${escapeCodeValue(node.value)}\``;
      const inner = serializeInlineNodes(node.children);
      const [open, close] = MARK_DELIMITERS[node.type];
      return `${open}${inner}${close}`;
    })
    .join("");
}

/** Serialize AST back to stored markup (round-trip helper). */
export function serializeMessageMarkup(nodes: MessageMarkupInlineNode[]): string {
  return serializeInlineNodes(nodes);
}
