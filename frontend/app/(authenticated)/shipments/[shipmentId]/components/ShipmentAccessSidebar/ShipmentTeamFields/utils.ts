export function shipmentUserDisplayLabel(
  userId: string,
  messageAuthorByUserId: Record<string, string>,
): string {
  return messageAuthorByUserId[userId]?.trim() || `User ${userId.slice(0, 8)}…`;
}
