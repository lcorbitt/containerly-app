import { createClient } from "@/lib/supabase/client";
import { profileDisplayName } from "@/lib/author-display-name";

export async function fetchProfileDisplayNameMap(userIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return {};
  const supabase = createClient();
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", unique);
  const map: Record<string, string> = {};
  for (const p of profs ?? []) {
    map[p.id as string] = profileDisplayName({
      full_name: p.full_name as string | null,
      email: p.email as string | null,
    });
  }
  return map;
}
