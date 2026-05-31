import { TOP_NAV_SHELL_CLASS } from "./constants";
import type { TopNavShellProps } from "./types";

export type { TopNavVariant } from "./types";

export function TopNavShell({ variant, children }: TopNavShellProps) {
  return (
    <header className={TOP_NAV_SHELL_CLASS[variant]}>
      <div className="mx-auto flex h-14 w-full items-center justify-between px-4 md:h-20 md:px-12">
        {children}
      </div>
    </header>
  );
}
