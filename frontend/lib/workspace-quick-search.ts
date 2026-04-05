import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkspaceQuickSearchRow = {
  kind: string;
  id: string;
  title: string;
  subtitle: string | null;
  path: string;
};

/**
 * Server-side quick lookup (Postgres RPC: workspace_quick_search). Honors RLS for the current user.
 */
export async function fetchWorkspaceQuickSearch(
  supabase: SupabaseClient,
  args: { organizationId: string; query: string; limit?: number },
): Promise<WorkspaceQuickSearchRow[]> {
  const q = args.query.trim();
  if (q.length < 2) return [];

  const { data, error } = await supabase.rpc("workspace_quick_search", {
    p_organization_id: args.organizationId,
    p_query: q,
    p_limit: args.limit ?? 8,
  });

  if (error) throw new Error(error.message);

  const rows = (data as WorkspaceQuickSearchRow[] | null) ?? [];
  return rows.map((r) => ({
    kind: r.kind,
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    path: r.path.startsWith("/") ? r.path : `/${r.path}`,
  }));
}
