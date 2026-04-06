/** URL-safe slug from a display name (shared by settings UI and org creation). */
export function slugFromOrganizationName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
}
