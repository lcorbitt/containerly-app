"use client";

import { EditorContent } from "@tiptap/react";
import { RichMessageFormattingBubble } from "./RichMessageFormattingBubble";
import {
  RICH_MESSAGE_EDITOR_INNER_CLASS,
  RICH_MESSAGE_EDITOR_PLACEHOLDER,
  RICH_MESSAGE_EDITOR_SHELL_CLASS,
} from "./constants";
import type { RichMessageEditorProps } from "./types";
import { useRichMessageEditor } from "./useRichMessageEditor";
import { useRichMessageFormattingBubble } from "./useRichMessageFormattingBubble";

export function RichMessageEditor({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = RICH_MESSAGE_EDITOR_PLACEHOLDER,
  className,
  "aria-label": ariaLabel = "Message",
}: RichMessageEditorProps) {
  const editor = useRichMessageEditor({
    value,
    onChange,
    onSubmit,
    disabled,
    placeholder,
  });

  const bubble = useRichMessageFormattingBubble(editor, disabled);

  if (!editor) {
    return <div className={`${RICH_MESSAGE_EDITOR_SHELL_CLASS} ${className ?? ""}`} aria-hidden />;
  }

  return (
    <div className={`${RICH_MESSAGE_EDITOR_SHELL_CLASS} ${className ?? ""}`}>
      <RichMessageFormattingBubble
        editor={editor}
        disabled={disabled}
        visible={bubble.visible}
        coords={bubble.coords}
        onPointerEnter={() => bubble.setBubbleHover(true)}
        onPointerLeave={() => {
          bubble.setBubbleHover(false);
          if (editor.state.selection.empty) bubble.hide();
        }}
      />
      <EditorContent
        editor={editor}
        className={RICH_MESSAGE_EDITOR_INNER_CLASS}
        aria-label={ariaLabel}
      />
    </div>
  );
}

export type { RichMessageEditorProps } from "./types";
