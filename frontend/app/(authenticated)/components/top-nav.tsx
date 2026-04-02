"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "";
  if (!local) return "?";
  const parts = local.split(/[.\-_]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function TopNav({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const logout = useCallback(async () => {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const initials = initialsFromEmail(email);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Containerly
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-800 ring-2 ring-transparent transition hover:bg-zinc-300 focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:focus-visible:ring-zinc-500"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            {initials}
          </button>

          {open ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
            >
              <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
                <p className="truncate text-xs text-zinc-500">Signed in as</p>
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {email || "Account"}
                </p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => void logout()}
                className="w-full cursor-pointer rounded-bl-xl rounded-br-xl p-4 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
