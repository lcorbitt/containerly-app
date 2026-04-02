import Link from "next/link";
import type { TopNavVariant } from "./top-nav-shell";

const brandClass: Record<TopNavVariant, string> = {
  marketing:
    "text-lg font-semibold tracking-tight text-white transition-[text-shadow] duration-300 hover:text-white [text-shadow:0_0_24px_var(--color-primary-orange)] md:text-xl",
  app: "text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-xl",
};

export function NavBrand({
  href,
  variant,
}: {
  href: string;
  variant: TopNavVariant;
}) {
  return (
    <Link href={href} className={brandClass[variant]}>
      Containerly
    </Link>
  );
}
