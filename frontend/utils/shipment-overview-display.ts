export function formatOverviewDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function displayOverviewText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

/** Consignee shown as "First L." in list tables; full name stays in the tooltip. */
export function displayConsigneeShortName(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return "—";
  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 2) return trimmed;
  const first = tokens[0];
  const lastInitial = tokens[tokens.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}
