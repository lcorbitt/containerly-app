import { createClient } from "@/lib/supabase/client";
import {
  ORG_IMAGES_BUCKET,
  buildOrgImageObjectPath,
  getOrgImagePublicUrl,
} from "@/lib/org-image";

export function getOrgImagePublicUrlBrowser(path: string | null | undefined): string | null {
  return getOrgImagePublicUrl(createClient(), path);
}

export async function fetchOrganizationImagePath(organizationId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("org_image_path")
    .eq("id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return ((data?.org_image_path as string | null | undefined) ?? null)?.trim() || null;
}

export async function uploadOrganizationImageAndSetPath(input: {
  organizationId: string;
  file: File;
  previousPath: string | null;
}): Promise<string> {
  const supabase = createClient();
  const objectPath = buildOrgImageObjectPath(input.organizationId, input.file);
  const { error: upErr } = await supabase.storage
    .from(ORG_IMAGES_BUCKET)
    .upload(objectPath, input.file, {
      contentType: input.file.type || undefined,
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const { error: dbErr } = await supabase
    .from("organizations")
    .update({ org_image_path: objectPath })
    .eq("id", input.organizationId);
  if (dbErr) {
    await supabase.storage.from(ORG_IMAGES_BUCKET).remove([objectPath]);
    throw new Error(dbErr.message);
  }

  if (input.previousPath?.trim()) {
    await supabase.storage.from(ORG_IMAGES_BUCKET).remove([input.previousPath.trim()]);
  }
  return objectPath;
}

export async function clearOrganizationImagePathAndRemoveStorage(input: {
  organizationId: string;
  storagePath: string;
}): Promise<{ storageRemoved: boolean }> {
  const supabase = createClient();
  const { error: dbErr } = await supabase
    .from("organizations")
    .update({ org_image_path: null })
    .eq("id", input.organizationId);
  if (dbErr) throw new Error(dbErr.message);

  const { error: rmErr } = await supabase.storage.from(ORG_IMAGES_BUCKET).remove([input.storagePath]);
  return { storageRemoved: !rmErr };
}
