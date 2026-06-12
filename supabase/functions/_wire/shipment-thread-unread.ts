/** True when the viewer should see an unread badge for this shipment thread. */
export function isShipmentThreadUnreadForViewer(input: {
  viewerUserId: string;
  lastAuthorUserId: string | null;
  lastMessageAt: string;
  lastReadAt: string | undefined;
}): boolean {
  if (input.lastAuthorUserId && input.lastAuthorUserId === input.viewerUserId) {
    return false;
  }
  if (!input.lastReadAt) return true;
  return Date.parse(input.lastMessageAt) > Date.parse(input.lastReadAt);
}
