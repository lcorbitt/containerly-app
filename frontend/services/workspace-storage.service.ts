import { createClient } from "@/lib/supabase/client";
import { WORKSPACE_FILES_BUCKET } from "@/lib/workspace-files";

export async function createWorkspaceStorageSignedUrl(
  storagePath: string,
  expiresSec = 3600,
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .createSignedUrl(storagePath, expiresSec);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Could not open file");
  return data.signedUrl;
}
