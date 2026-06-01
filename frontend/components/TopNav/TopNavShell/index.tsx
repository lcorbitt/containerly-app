import { ThemeToggle } from "@/components/ThemeToggle";
import {
  TOP_NAV_SHELL_CLASS,
  TOP_NAV_SHELL_INNER_CLASS,
  TOP_NAV_THEME_TOGGLE_BOOKMARK_CLASS,
  TOP_NAV_THEME_TOGGLE_BOOKMARK_BUTTON_CLASS,
} from "./constants";
import type { TopNavShellProps } from "./types";

export type { TopNavVariant } from "./types";

export function TopNavShell({ variant, children }: TopNavShellProps) {
  return (
    <header className={TOP_NAV_SHELL_CLASS[variant]}>
      <div className={TOP_NAV_SHELL_INNER_CLASS}>{children}</div>
      <div className={TOP_NAV_THEME_TOGGLE_BOOKMARK_CLASS}>
        <ThemeToggle className={TOP_NAV_THEME_TOGGLE_BOOKMARK_BUTTON_CLASS[variant]} />
      </div>
    </header>
  );
}
