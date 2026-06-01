import Link from "next/link";
import { getSideNavLinkClassName } from "../utils";
import type { SideNavLinkProps } from "./types";

export function SideNavLink({ href, label, icon: Icon, active }: SideNavLinkProps) {
  return (
    <Link
      href={href}
      className={getSideNavLinkClassName(active)}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
      <span className="min-w-0 wrap-break-word">{label}</span>
    </Link>
  );
}
