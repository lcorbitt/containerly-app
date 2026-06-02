"use client";

import { Bold, Code, Italic, Strikethrough, Underline } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import {
  RICH_MESSAGE_FORMATTING_BUBBLE_ARROW_CLASS,
  RICH_MESSAGE_FORMATTING_BUBBLE_BUTTON_ACTIVE_CLASS,
  RICH_MESSAGE_FORMATTING_BUBBLE_BUTTON_CLASS,
  RICH_MESSAGE_FORMATTING_BUBBLE_CLASS,
  RICH_MESSAGE_FORMATTING_BUBBLE_REVEAL_DURATION_MS,
} from "../constants";
import type { FormattingBubbleCoords } from "../useRichMessageFormattingBubble";

function BubbleButton({
  label,
  active,
  disabled,
  onPress,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={`${RICH_MESSAGE_FORMATTING_BUBBLE_BUTTON_CLASS}${
        active ? ` ${RICH_MESSAGE_FORMATTING_BUBBLE_BUTTON_ACTIVE_CLASS}` : ""
      }`}
    >
      {children}
    </button>
  );
}

export function RichMessageFormattingBubble({
  editor,
  disabled,
  visible,
  coords,
  onPointerEnter,
  onPointerLeave,
}: {
  editor: Editor;
  disabled?: boolean;
  visible: boolean;
  coords: FormattingBubbleCoords | null;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  if (!coords || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="toolbar"
      aria-label="Text formatting"
      style={{
        position: "fixed",
        left: coords.left,
        top: coords.top,
        zIndex: 60,
        transform: "translate(-50%, -100%)",
      }}
      className="pointer-events-none"
      aria-hidden={!visible}
    >
      <Reveal show={visible} durationMs={RICH_MESSAGE_FORMATTING_BUBBLE_REVEAL_DURATION_MS}>
        <div
          className="pointer-events-auto"
          onMouseDown={(e) => e.preventDefault()}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        >
          <div className={`relative ${RICH_MESSAGE_FORMATTING_BUBBLE_CLASS}`}>
            <BubbleButton
              label="Bold"
              active={editor.isActive("bold")}
              disabled={disabled}
              onPress={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            </BubbleButton>
            <BubbleButton
              label="Italic"
              active={editor.isActive("italic")}
              disabled={disabled}
              onPress={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            </BubbleButton>
            <BubbleButton
              label="Underline"
              active={editor.isActive("underline")}
              disabled={disabled}
              onPress={() => editor.chain().focus().toggleUnderline().run()}
            >
              <Underline className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            </BubbleButton>
            <BubbleButton
              label="Strikethrough"
              active={editor.isActive("strike")}
              disabled={disabled}
              onPress={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            </BubbleButton>
            <BubbleButton
              label="Inline code"
              active={editor.isActive("code")}
              disabled={disabled}
              onPress={() => editor.chain().focus().toggleCode().run()}
            >
              <Code className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            </BubbleButton>
            <span className={RICH_MESSAGE_FORMATTING_BUBBLE_ARROW_CLASS} aria-hidden />
          </div>
        </div>
      </Reveal>
    </div>,
    document.body,
  );
}
