import type { ReactNode } from "react";

export interface RadioGroupProps {
  children: ReactNode;
  className?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}

export interface RadioProps {
  id?: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  /** Simple text label; use `children` for richer label content. */
  label?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export interface RadioTileProps extends Omit<RadioProps, "label" | "children"> {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}
