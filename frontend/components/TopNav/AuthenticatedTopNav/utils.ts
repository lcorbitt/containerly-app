export function initialsFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "";
  if (!local) return "?";
  const parts = local.split(/[.\-_]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function profileMenuLabels(
  fullName: string | null | undefined,
  email: string,
): { primary: string; secondary: string | null } {
  const name = fullName?.trim() ?? "";
  const mail = email.trim();
  if (name) {
    return { primary: name, secondary: mail || null };
  }
  return { primary: mail || "Account", secondary: null };
}
