import { formatRelativeTimeAgo } from "@/utils/datetime";

export function shipmentCreatedBannerText(createdAt: string, creatorName: string | null | undefined): string {
  const ago = formatRelativeTimeAgo(createdAt);
  const by = creatorName?.trim();
  return by ? `Created ${ago} by ${by}` : `Created ${ago}`;
}
