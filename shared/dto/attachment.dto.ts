export const ATTACHMENT_UPLOADER_KINDS = ["operator", "customer"] as const;

export type AttachmentUploaderKind = (typeof ATTACHMENT_UPLOADER_KINDS)[number];

export function attachmentUploaderKindLabel(
  kind: AttachmentUploaderKind | string | null | undefined,
): string {
  return kind === "customer" ? "Customer" : "Operator";
}
