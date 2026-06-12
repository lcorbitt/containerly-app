import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { fetchSettingsPageProfileQuery } from "@supabase-shared/profile-operations.service";

export type ProfileSettingsPageData = Awaited<ReturnType<typeof fetchSettingsPageProfileQuery>>;

/** Per-request profile fields for settings pages (deduped via `cache`). */
export const loadProfileSettingsPageData = cache(
  async (userId: string): Promise<ProfileSettingsPageData> => {
    const supabase = await createClient();
    return fetchSettingsPageProfileQuery(supabase, userId);
  },
);
