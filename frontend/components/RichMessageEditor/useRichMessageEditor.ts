"use client";

import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import {
  messageMarkupToTiptapDoc,
  tiptapDocToMessageMarkup,
} from "./utils";

export function useRichMessageEditor(input: {
  value: string;
  onChange: (markdown: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const syncingRef = useRef(false);
  const onChangeRef = useRef(input.onChange);
  const onSubmitRef = useRef(input.onSubmit);

  useEffect(() => {
    onChangeRef.current = input.onChange;
    onSubmitRef.current = input.onSubmit;
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: {},
      }),
      Underline,
      Placeholder.configure({
        placeholder: input.placeholder ?? "Message here…",
      }),
    ],
    content: messageMarkupToTiptapDoc(input.value),
    editable: !input.disabled,
    autofocus: input.autoFocus ? "end" : false,
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSubmitRef.current();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (syncingRef.current) return;
      const markdown = tiptapDocToMessageMarkup(ed.getJSON());
      onChangeRef.current(markdown);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!input.disabled);
  }, [editor, input.disabled]);

  useEffect(() => {
    if (!editor || !input.autoFocus || input.disabled) return;
    requestAnimationFrame(() => {
      editor.commands.focus("end");
    });
  }, [editor, input.autoFocus, input.disabled]);

  useEffect(() => {
    if (!editor) return;
    if (input.value !== "") return;
    const current = tiptapDocToMessageMarkup(editor.getJSON());
    if (!current.trim()) return;
    syncingRef.current = true;
    editor.commands.setContent(messageMarkupToTiptapDoc(""));
    syncingRef.current = false;
  }, [editor, input.value]);

  return editor;
}
