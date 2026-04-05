"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { acceptImporterInvite } from "@/lib/supabase/shipment-edge";
import { createClient } from "@/lib/supabase/client";
import { PageLoading } from "@/components/page-loading";

function InviteAcceptInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!sessionData.session) {
        const next = `/invite/accept?token=${encodeURIComponent(token)}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const r = await acceptImporterInvite(token);
      if (cancelled) return;

      if (!r.ok) {
        setStatus("error");
        setMessage(r.error);
        return;
      }

      setStatus("done");
      router.replace(`/shipments/hub/${r.shipment_id}`);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Could not accept invite</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Missing invite token. Use the link from your email.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (status === "error" && message) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Could not accept invite</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16">
      <PageLoading loadingText="Confirming your access…" />
    </div>
  );
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
