import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile, type SessionProfile } from "@/services/auth-server.service";
import { fetchOrgMembershipRows } from "@/services/organization.server";
import { isSuperadminRole } from "@/utils/profile-role";
import type { OrgMembershipRow } from "@/types/organization-workspace";

export interface AuthenticatedLayoutSession {
  user: User;
  profile: SessionProfile | null;
  isSuperAdmin: boolean;
  initialOrgs: OrgMembershipRow[];
}

/** Per-request session for `(authenticated)` and nested layouts (deduped via `cache`). */
export const loadAuthenticatedLayoutSession = cache(
  async (): Promise<AuthenticatedLayoutSession | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const profile = await getSessionProfile(supabase, user.id);
    const isSuperAdmin = isSuperadminRole(profile?.role);
    const initialOrgs = await fetchOrgMembershipRows(supabase, user.id, isSuperAdmin);

    return { user, profile, isSuperAdmin, initialOrgs };
  },
);
