import { createClient } from "@/lib/supabase/client";
import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import { edgeFunctionFetch, parseEdgeJson } from "@/lib/supabase/edge-functions";
import { getProfileImagePublicUrl } from "@/utils/profile-image";
import type { Profile } from "@/types/database";

export function getProfileImagePublicUrlBrowser(path: string | null | undefined): string | null {
  return getProfileImagePublicUrl(createClient(), path);
}

export async function fetchProfileImagePath(): Promise<string | null> {
  const body = await parseEdgeJson<{ profileImagePath: string | null }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.profile.getMy),
  );
  return body.profileImagePath?.trim() || null;
}

/** Current user's display fields (name + avatar path) — used by the customer portal top nav. */
export async function fetchMyProfileFields(): Promise<{
  profileImagePath: string | null;
  fullName: string | null;
}> {
  return parseEdgeJson<{ profileImagePath: string | null; fullName: string | null }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.profile.getMy),
  );
}

export async function updateProfileFullName(fullName: string | null): Promise<void> {
  await parseEdgeJson<{ ok: true }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.profile.updateMy, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName }),
    }),
  );
}

export async function createProfileImageAndSetPath(input: {
  file: File;
  previousPath: string | null;
}): Promise<string> {
  const formData = new FormData();
  formData.set("file", input.file);
  if (input.previousPath?.trim()) {
    formData.set("previousPath", input.previousPath.trim());
  }
  const data = await parseEdgeJson<{ path?: string }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.profile.createImage, {
      method: "POST",
      body: formData,
    }),
  );
  if (!data.path) throw new Error("Missing path in response");
  return data.path;
}

export async function clearProfileImagePathAndRemoveStorage(input: {
  storagePath: string;
}): Promise<{ storageRemoved: boolean }> {
  return parseEdgeJson<{ storageRemoved: boolean }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.profile.deleteImage, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storagePath: input.storagePath }),
    }),
  );
}

export async function updateProfilePlatformRole(
  profileId: string,
  role: Profile["role"],
): Promise<Pick<Profile, "id" | "email" | "full_name" | "role" | "created_at">> {
  const data = await parseEdgeJson<{
    profile?: Pick<Profile, "id" | "email" | "full_name" | "role" | "created_at">;
  }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.profile.updateRole, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId, role }),
    }),
  );
  if (!data.profile) throw new Error("Missing profile in response");
  return data.profile;
}

export async function fetchProfileDisplayNameMap(userIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return {};
  const { map } = await parseEdgeJson<{ map: Record<string, string> }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.profile.displayNames, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: unique }),
    }),
  );
  return map ?? {};
}
