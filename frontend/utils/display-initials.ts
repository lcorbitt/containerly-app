/** First + last word initials, or first two characters of a single token. */
export function displayInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function initialsFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "";
  if (!local) return "?";
  const parts = local.split(/[.\-_]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

/** Avatar placeholder initials — prefer profile full name, then email local-part rules. */
export function profileInitials(input: {
  full_name?: string | null;
  email?: string | null;
}): string {
  const name = input.full_name?.trim();
  if (name) return displayInitialsFromName(name);
  return initialsFromEmail(input.email?.trim() ?? "");
}
