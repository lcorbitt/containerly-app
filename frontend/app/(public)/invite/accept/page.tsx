"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageLoading } from "@/components/PageLoading";
import { InviteAcceptPanel } from "./components/InviteAcceptPanel";

function InviteAcceptInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Could not accept invite</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Missing invite token. Use the link from your email.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium underline">
          Sign In
        </Link>
      </div>
    );
  }

  return <InviteAcceptPanel token={token} />;
}

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
          <PageLoading loadingText="Loading…" />
        </div>
      }
    >
      <InviteAcceptInner />
    </Suspense>
  );
}
