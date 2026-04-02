import type { ReactNode } from "react";

export type TopNavVariant = "marketing" | "app";

const shellByVariant: Record<TopNavVariant, string> = {
  marketing:
    "relative z-50 shrink-0 border-b border-white/10 bg-[#030303]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[#030303]/80",
  app: "z-40 shrink-0 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90",
};

export function TopNavShell({
  variant,
  children,
}: {
  variant: TopNavVariant;
  children: ReactNode;
}) {
  return (
    <header className={shellByVariant[variant]}>
      <div className="mx-auto flex h-14 w-full items-center justify-between px-4 md:h-16 md:px-12">
        {children}
      </div>
    </header>
  );
}
