"use client";

import Link from "next/link";
import { AlertTriangle, Compass } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { MarketingTopNav } from "@/components/TopNav";
import {
  ACCENT_BTN_CLASS,
  ERROR_DEFAULT_DESCRIPTION,
  ERROR_DEFAULT_TITLE,
  GHOST_BTN_CLASS,
  NOT_FOUND_DEFAULT_DESCRIPTION,
  NOT_FOUND_DEFAULT_TITLE,
  PROBLEM_PAGE_CARD_CLASS,
  PROBLEM_PAGE_CTA_ROW_CLASS,
  PROBLEM_PAGE_DESCRIPTION_CLASS,
  PROBLEM_PAGE_EMBEDDED_SHELL_CLASS,
  PROBLEM_PAGE_EYEBROW_CLASS,
  PROBLEM_PAGE_ICON_CLASS,
  PROBLEM_PAGE_STANDALONE_CONTENT_CLASS,
  PROBLEM_PAGE_STANDALONE_SHELL_CLASS,
  PROBLEM_PAGE_TITLE_CLASS,
  RETRY_BTN_CLASS,
} from "./constants";
import type { AppProblemPageProps } from "./types";

function ProblemIcon({ kind }: { kind: AppProblemPageProps["kind"] }) {
  if (kind === "error") {
    return <AlertTriangle className={PROBLEM_PAGE_ICON_CLASS} strokeWidth={1.25} aria-hidden />;
  }

  return <Compass className={PROBLEM_PAGE_ICON_CLASS} strokeWidth={1.25} aria-hidden />;
}

function ProblemContent({
  kind,
  title,
  description,
  primaryCta,
  secondaryCta,
  onRetry,
}: Omit<AppProblemPageProps, "variant">) {
  const eyebrow = kind === "notFound" ? "404" : "Error";
  const resolvedTitle =
    title ?? (kind === "notFound" ? NOT_FOUND_DEFAULT_TITLE : ERROR_DEFAULT_TITLE);
  const resolvedDescription =
    description ??
    (kind === "notFound" ? NOT_FOUND_DEFAULT_DESCRIPTION : ERROR_DEFAULT_DESCRIPTION);

  return (
    <Reveal whenInView className="w-full max-w-md">
      <div className={PROBLEM_PAGE_CARD_CLASS}>
        <ProblemIcon kind={kind} />
        <p className={PROBLEM_PAGE_EYEBROW_CLASS}>{eyebrow}</p>
        <h1 className={PROBLEM_PAGE_TITLE_CLASS}>{resolvedTitle}</h1>
        <p className={PROBLEM_PAGE_DESCRIPTION_CLASS}>{resolvedDescription}</p>
      </div>

      <div className={PROBLEM_PAGE_CTA_ROW_CLASS}>
        {onRetry ? (
          <button type="button" onClick={onRetry} className={RETRY_BTN_CLASS}>
            Try again
          </button>
        ) : null}
        <Link href={primaryCta.href} className={ACCENT_BTN_CLASS}>
          {primaryCta.label}
        </Link>
        {secondaryCta ? (
          <Link href={secondaryCta.href} className={GHOST_BTN_CLASS}>
            {secondaryCta.label}
          </Link>
        ) : null}
      </div>
    </Reveal>
  );
}

export function AppProblemPage({ variant, ...contentProps }: AppProblemPageProps) {
  if (variant === "standalone") {
    return (
      <div className={PROBLEM_PAGE_STANDALONE_SHELL_CLASS}>
        <MarketingTopNav />
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
          <div className="landing-grid-bg absolute inset-0" />
          <div className="landing-hero-glow opacity-60" />
        </div>
        <div className={`${PROBLEM_PAGE_STANDALONE_CONTENT_CLASS} text-center`}>
          <ProblemContent {...contentProps} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${PROBLEM_PAGE_EMBEDDED_SHELL_CLASS} text-center`}>
      <ProblemContent {...contentProps} />
    </div>
  );
}
