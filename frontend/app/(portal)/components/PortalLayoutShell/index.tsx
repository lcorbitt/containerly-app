"use client";

import { CustomerTopNav } from "@/components/TopNav";
import { PORTAL_LAYOUT_SHELL_CLASS, PORTAL_LAYOUT_SHELL_MAIN_CLASS } from "./constants";
import type { PortalLayoutShellProps } from "./types";

/** Customer / unsigned-in portal chrome (no operator SideNav). */
export function PortalLayoutShell({ children }: PortalLayoutShellProps) {
  return (
    <div className={PORTAL_LAYOUT_SHELL_CLASS}>
      <CustomerTopNav />
      <main className={PORTAL_LAYOUT_SHELL_MAIN_CLASS}>{children}</main>
    </div>
  );
}
