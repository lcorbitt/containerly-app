export function normalizeContainerNumber(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}
