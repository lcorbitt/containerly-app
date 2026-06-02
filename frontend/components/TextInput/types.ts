import type { InputHTMLAttributes } from "react";

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  type?: "text" | "search" | "email" | "password";
  /** Show a clear control when the field has a value. Default true. */
  clearable?: boolean;
  containerClassName?: string;
  onClear?: () => void;
}
