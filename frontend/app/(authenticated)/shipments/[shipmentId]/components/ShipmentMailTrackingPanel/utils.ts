/** Minimum valid length for a physical mail tracking number (after trim). */
export function isValidMailTrackingNumber(value: string): boolean {
  return value.trim().length > 1;
}
