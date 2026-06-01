import { Loader2 } from "lucide-react";
import {
  PAGE_LOADING_CONTENT_CLASS,
  PAGE_LOADING_OVERLAY_SHELL_CLASS,
  PAGE_LOADING_SHELL_CLASS,
} from "./constants";

type PageLoadingProps = {
  loadingText?: string;
  variant?: "page" | "overlay";
};

export function PageLoading({ loadingText, variant = "page" }: PageLoadingProps) {
  const shellClass =
    variant === "overlay" ? PAGE_LOADING_OVERLAY_SHELL_CLASS : `${PAGE_LOADING_SHELL_CLASS} flex-1`;

  return (
    <div
      className={shellClass}
      role={variant === "page" ? "status" : undefined}
      aria-live={variant === "page" ? "polite" : undefined}
      aria-busy={variant === "page" ? true : undefined}
    >
      <div className={PAGE_LOADING_CONTENT_CLASS}>
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-zinc-500 dark:text-zinc-400"
          aria-hidden
        />
        {loadingText != null && loadingText !== "" ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">{loadingText}</p>
        ) : null}
      </div>
    </div>
  );
}
