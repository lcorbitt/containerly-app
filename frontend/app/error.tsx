"use client";

import { useEffect } from "react";
import { AppProblemPage } from "@/components/AppProblemPage";
import { PUBLIC_ERROR_CTAS } from "@/components/AppProblemPage/utils";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppProblemPage
      variant="standalone"
      kind="error"
      primaryCta={PUBLIC_ERROR_CTAS.primaryCta}
      secondaryCta={PUBLIC_ERROR_CTAS.secondaryCta}
      onRetry={reset}
    />
  );
}
