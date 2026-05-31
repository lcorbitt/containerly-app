/** Split comma-separated importer emails / group mailing lists (e.g. team@company.com). */
export function parseCustomerInviteRecipients(raw: string): {
  emails: string[];
  invalidTokens: string[];
} {
  const invalidTokens: string[] = [];
  const seen = new Set<string>();
  const emails: string[] = [];

  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    const token = trimmed.toLowerCase();
    if (!token) continue;

    if (!token.includes("@") || token.startsWith("@") || token.endsWith("@")) {
      invalidTokens.push(trimmed);
      continue;
    }

    if (seen.has(token)) continue;
    seen.add(token);
    emails.push(token);
  }

  return { emails, invalidTokens };
}
