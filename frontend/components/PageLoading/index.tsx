import { Loader2 } from "lucide-react";
import { PAGE_LOADING_CONTENT_CLASS, PAGE_LOADING_SHELL_CLASS } from "./constants";

type PageLoadingProps = {
  loadingText?: string;
};

export function PageLoading({ loadingText }: PageLoadingProps) {
  return (
    <div className={`${PAGE_LOADING_SHELL_CLASS} flex-1`} role="status" aria-live="polite" aria-busy="true">
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
