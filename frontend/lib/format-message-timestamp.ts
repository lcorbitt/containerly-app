/** Compact display: e.g. `4/2/26, 9:12 PM` (2-digit year, no seconds). */
export function formatMessageTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
