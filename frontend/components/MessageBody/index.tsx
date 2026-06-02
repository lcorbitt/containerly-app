"use client";

import { useMemo } from "react";
import { parseMessageMarkup, type MessageMarkupInlineNode } from "@/utils/message-markup";
import { MESSAGE_BODY_CLASS, MESSAGE_BODY_CODE_CLASS } from "./constants";
import type { MessageBodyProps } from "./types";

function renderInlineNodes(nodes: MessageMarkupInlineNode[], keyPrefix: string) {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (node.type === "text") {
      return <span key={key}>{node.value}</span>;
    }
    if (node.type === "code") {
      return (
        <code key={key} className={MESSAGE_BODY_CODE_CLASS}>
          {node.value}
        </code>
      );
    }
    const children = renderInlineNodes(node.children, key);
    switch (node.type) {
      case "bold":
        return <strong key={key}>{children}</strong>;
      case "italic":
        return <em key={key}>{children}</em>;
      case "underline":
        return <u key={key}>{children}</u>;
      case "strike":
        return <s key={key}>{children}</s>;
      default:
        return null;
    }
  });
}

export function MessageBody({ text, className }: MessageBodyProps) {
  const nodes = useMemo(() => parseMessageMarkup(text), [text]);
  if (!text.trim() && nodes.length === 0) return null;

  return (
    <p className={className ?? MESSAGE_BODY_CLASS}>{renderInlineNodes(nodes, "msg")}</p>
  );
}

export type { MessageBodyProps } from "./types";
