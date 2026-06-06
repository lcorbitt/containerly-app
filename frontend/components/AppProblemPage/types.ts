export type AppProblemPageVariant = "standalone" | "embedded";

export type AppProblemPageKind = "notFound" | "error";

export interface ProblemPageCta {
  href: string;
  label: string;
}

export interface AppProblemPageProps {
  variant: AppProblemPageVariant;
  kind: AppProblemPageKind;
  title?: string;
  description?: string;
  primaryCta: ProblemPageCta;
  secondaryCta?: ProblemPageCta;
  onRetry?: () => void;
}
