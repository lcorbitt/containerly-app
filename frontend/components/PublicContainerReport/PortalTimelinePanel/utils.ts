import type { PortalAttachment } from "@shared/dto/shipment.dto";

export function buildPortalAttachmentDisplayNameMap(
  attachments: PortalAttachment[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const attachment of attachments) {
    const name = attachment.file_name?.trim();
    if (name) out[attachment.id] = name;
  }
  return out;
}
