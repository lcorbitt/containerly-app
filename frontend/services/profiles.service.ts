import { readApiJson } from "@/services/json-api";
import type { Profile } from "@/types/database";

export async function patchProfilePlatformRole(
  profileId: string,
  role: Profile["role"],
): Promise<Pick<Profile, "id" | "email" | "full_name" | "role" | "created_at">> {
  const res = await fetch(`/api/profiles/${profileId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const data = await readApiJson<{
    profile?: Pick<Profile, "id" | "email" | "full_name" | "role" | "created_at">;
  }>(res);
  if (!data.profile) throw new Error("Missing profile in response");
  return data.profile;
}
