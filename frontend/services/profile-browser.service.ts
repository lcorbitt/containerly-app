import { createClient } from "@/lib/supabase/client";
import {
  PROFILE_IMAGES_BUCKET,
  buildProfileImageObjectPath,
  getProfileImagePublicUrl,
} from "@/lib/profile-image";

export function getProfileImagePublicUrlBrowser(path: string | null | undefined): string | null {
  return getProfileImagePublicUrl(createClient(), path);
}

export async function fetchProfileImagePath(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("profile_image_path")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return ((data?.profile_image_path as string | null | undefined) ?? null)?.trim() || null;
}

export async function updateProfileFullName(userId: string, fullName: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function uploadProfileImageAndSetPath(input: {
  userId: string;
  file: File;
  previousPath: string | null;
}): Promise<string> {
  const supabase = createClient();
  const objectPath = buildProfileImageObjectPath(input.userId, input.file);
  const { error: upErr } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(objectPath, input.file, {
      contentType: input.file.type || undefined,
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ profile_image_path: objectPath })
    .eq("id", input.userId);
  if (dbErr) {
    await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([objectPath]);
    throw new Error(dbErr.message);
  }

  if (input.previousPath?.trim()) {
    await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([input.previousPath.trim()]);
  }
  return objectPath;
}

export async function clearProfileImagePathAndRemoveStorage(input: {
  userId: string;
  storagePath: string;
}): Promise<{ storageRemoved: boolean }> {
  const supabase = createClient();
  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ profile_image_path: null })
    .eq("id", input.userId);
  if (dbErr) throw new Error(dbErr.message);

  const { error: rmErr } = await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([input.storagePath]);
  return { storageRemoved: !rmErr };
}
