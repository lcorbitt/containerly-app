import { TOP_NAV_SHELL_CLASS, TOP_NAV_SHELL_INNER_CLASS } from "./constants";
import type { TopNavShellProps } from "./types";

export type { TopNavVariant } from "./types";

export function TopNavShell({ variant, children, footer }: TopNavShellProps) {
  return (
    <header className={TOP_NAV_SHELL_CLASS[variant]}>
      <div className={TOP_NAV_SHELL_INNER_CLASS}>{children}</div>
      {footer}
    </header>
  );
}
