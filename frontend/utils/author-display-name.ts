/** Derive a readable label from account email when no full name is set. */
export function formatAuthorNameFromEmail(email: string | null | undefined): string {
  const e = email?.trim();
  if (!e) return "Team member";
  const local = e.split("@")[0]?.trim() ?? "";
  if (!local) return "Team member";
  return local
    .replace(/[._]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Prefer profiles.full_name, then formatted email. */
export function profileDisplayName(input: {
  full_name?: string | null;
  email?: string | null;
}): string {
  const n = input.full_name?.trim();
  if (n) return n;
  return formatAuthorNameFromEmail(input.email);
}
