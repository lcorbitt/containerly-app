"use client";

import { useEffect } from "react";
import { AppProblemPage } from "@/components/AppProblemPage";
import { CUSTOMER_ERROR_CTAS } from "@/components/AppProblemPage/utils";

export default function CustomerError({
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
      variant="embedded"
      kind="error"
      primaryCta={CUSTOMER_ERROR_CTAS.primaryCta}
      onRetry={reset}
    />
  );
}
