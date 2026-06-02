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
