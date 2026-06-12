export function welcomeDisplayName(fullName: string | null, email: string): string {
  const trimmed = fullName?.trim();
  if (trimmed) return trimmed;
  const local = email.split("@")[0]?.trim();
  return local || "there";
}
