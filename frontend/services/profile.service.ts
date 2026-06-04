import { createClient } from "@/lib/supabase/client";
import { getProfileImagePublicUrl } from "@/utils/profile-image";
import { apiJson } from "@/utils/api-client";
import { readApiJson } from "@/utils/json-api";
import type { Profile } from "@/types/database";

export function getProfileImagePublicUrlBrowser(path: string | null | undefined): string | null {
  return getProfileImagePublicUrl(createClient(), path);
}

export async function fetchProfileImagePath(): Promise<string | null> {
  const { profileImagePath } = await apiJson<{ profileImagePath: string | null }>("/api/me/profile");
  return profileImagePath?.trim() || null;
}

/** Current user's display fields (name + avatar path) — used by the customer portal top nav. */
export async function fetchMyProfileFields(): Promise<{
  profileImagePath: string | null;
  fullName: string | null;
}> {
  return apiJson<{ profileImagePath: string | null; fullName: string | null }>("/api/me/profile");
}

export async function updateProfileFullName(fullName: string | null): Promise<void> {
  await apiJson("/api/me/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: fullName }),
  });
}

export async function uploadProfileImageAndSetPath(input: {
  file: File;
  previousPath: string | null;
}): Promise<string> {
  const formData = new FormData();
  formData.set("file", input.file);
  if (input.previousPath?.trim()) {
    formData.set("previousPath", input.previousPath.trim());
  }
  const res = await fetch("/api/me/profile/image", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const data = await readApiJson<{ path?: string }>(res);
  if (!data.path) throw new Error("Missing path in response");
  return data.path;
}

export async function clearProfileImagePathAndRemoveStorage(input: {
  storagePath: string;
}): Promise<{ storageRemoved: boolean }> {
  return apiJson<{ storageRemoved: boolean }>("/api/me/profile/image", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storagePath: input.storagePath }),
  });
}

export async function patchProfilePlatformRole(
  profileId: string,
  role: Profile["role"],
): Promise<Pick<Profile, "id" | "email" | "full_name" | "role" | "created_at">> {
  const data = await apiJson<{
    profile?: Pick<Profile, "id" | "email" | "full_name" | "role" | "created_at">;
  }>(`/api/profiles/${encodeURIComponent(profileId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!data.profile) throw new Error("Missing profile in response");
  return data.profile;
}

export async function fetchProfileDisplayNameMap(userIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return {};
  const { map } = await apiJson<{ map: Record<string, string> }>("/api/me/profile/display-names", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds: unique }),
  });
  return map ?? {};
}
