"use client";

import { useEffect } from "react";
import { AppProblemPage } from "@/components/AppProblemPage";
import { OPERATOR_ERROR_CTAS } from "@/components/AppProblemPage/utils";

export default function AuthenticatedError({
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
      primaryCta={OPERATOR_ERROR_CTAS.primaryCta}
      secondaryCta={OPERATOR_ERROR_CTAS.secondaryCta}
      onRetry={reset}
    />
  );
}
