/** Escape `%`, `_`, `\` for PostgREST `ilike` filters. */
export function sanitizeIlikeTerm(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
