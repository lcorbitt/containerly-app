import { Loader2 } from "lucide-react";

type PageLoadingProps = {
  loadingText?: string;
};

export function PageLoading({ loadingText }: PageLoadingProps) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className="h-4 w-4 shrink-0 animate-spin text-zinc-500 dark:text-zinc-400"
        aria-hidden
      />
      {loadingText != null && loadingText !== "" ? (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          {loadingText}
        </p>
      ) : null}
    </div>
  );
}
