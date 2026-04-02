"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavBrand } from "./nav-brand";
import { TopNavShell } from "./top-nav-shell";

const navLinkClass =
  "text-sm font-medium text-zinc-400 transition-colors hover:text-white";

const ctaClass =
  "rounded-full border border-primary-orange/85 bg-black/55 px-4 py-2 text-sm font-semibold text-primary-orange shadow-[0_0_24px_rgba(255,78,0,0.32)] backdrop-blur-sm transition-[box-shadow,transform,border-color,background-color] hover:border-primary-orange hover:bg-primary-orange/10 hover:shadow-[0_0_32px_rgba(255,78,0,0.45)] active:scale-[0.98]";

const secondaryLinkClass =
  "rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-primary-orange/50 hover:text-white";

const publicLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#security", label: "Security" },
] as const;

export function PublicTopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      <TopNavShell variant="marketing">
        <NavBrand href="/" variant="marketing" />

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Marketing"
        >
          {publicLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={navLinkClass}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className={secondaryLinkClass}>
            Sign in
          </Link>
          <Link href="/login" className={ctaClass}>
            Get started
          </Link>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-200 md:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </TopNavShell>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-[#030303] pt-14 md:hidden">
          <div className="flex flex-1 flex-col gap-1 px-4 py-6">
            {publicLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-3 text-base font-medium text-zinc-200 hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <hr className="my-4 border-white/10" />
            <Link
              href="/login"
              className="rounded-lg px-3 py-3 text-base font-medium text-zinc-200 hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className={ctaClass + " mt-2 text-center"}
              onClick={() => setMobileOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
