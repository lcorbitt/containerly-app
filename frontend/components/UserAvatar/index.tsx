/** Small circular avatar: photo from `imageUrl` or initial from `label`. */
export function UserAvatar({
  imageUrl,
  label,
  size = "sm",
  className = "",
}: {
  imageUrl: string | null;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const initial = (label.trim().at(0) ?? "?").toUpperCase();
  const box =
    size === "md"
      ? "h-8 w-8 text-xs"
      : "h-6 w-6 text-[10px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 font-semibold text-zinc-700 dark:bg-zinc-600 dark:text-zinc-100 ${box} ${className}`}
      aria-hidden
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- public Supabase URL, small avatar
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
