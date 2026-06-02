export interface RichMessageEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  autoFocus?: boolean;
}
