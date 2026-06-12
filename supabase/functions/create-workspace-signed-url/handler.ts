import { requireAuthUserId } from "@services/auth";
import { createUserClient } from "@services/db";
import { createAuthorizedWorkspaceStorageSignedUrlForUser } from "@services/workspace/workspace.service";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";
import type { CreateWorkspaceSignedUrlBody } from "@shared/dto/workspace.dto";
import {
  usesWorkspaceStorageImageTransform,
  workspaceStorageImageTransform,
  type WorkspaceStoragePreviewVariant,
} from "@shared/workspace-storage-preview";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function errorStatus(message: string): number {
  if (message === "Attachment not found") return 404;
  if (message === "No access to this file") return 403;
  return 400;
}

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;
    const body = (await req.json()) as CreateWorkspaceSignedUrlBody;
    const storagePath = typeof body.storage_path === "string" ? body.storage_path.trim() : "";
    if (!storagePath) return jsonResponse({ error: "storage_path required" }, { status: 400 });
    const orgSegment = storagePath.split("/")[0]?.trim() ?? "";
    if (!UUID_RE.test(orgSegment)) return jsonResponse({ error: "Invalid workspace storage path" }, { status: 400 });
    const expiresSec = Math.min(86400, Math.max(60, Number(body.expires_sec ?? 3600) || 3600));
    const downloadFileName = typeof body.download_file_name === "string" ? body.download_file_name.trim() : undefined;
    const previewVariant = body.preview_variant as WorkspaceStoragePreviewVariant | undefined;
    const transform = previewVariant && usesWorkspaceStorageImageTransform(previewVariant)
      ? workspaceStorageImageTransform(previewVariant)
      : undefined;
    const url = await createAuthorizedWorkspaceStorageSignedUrlForUser(
      userClient,
      auth.userId,
      storagePath,
      expiresSec,
      { downloadFileName, transform },
    );
    return jsonResponse({ url });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: errorStatus(message) });
  }
}
