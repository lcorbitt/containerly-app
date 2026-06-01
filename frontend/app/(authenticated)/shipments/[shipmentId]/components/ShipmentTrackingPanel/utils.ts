import type { WorkspaceAttachment } from "@/types/database";

export function buildAttachmentDisplayNameMap(
  attachments: WorkspaceAttachment[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const attachment of attachments) {
    const name = attachment.file_name?.trim();
    if (name) out[attachment.id] = name;
  }
  return out;
}
