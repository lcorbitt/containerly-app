import type { OrgPerformanceSettings } from "@shared/dto/performance.dto";
import { apiJson } from "@/utils/api-client";

export async function fetchOrganizationPerformanceSettingsBrowser(
  organizationId: string,
): Promise<OrgPerformanceSettings> {
  const r = await apiJson<{ ok: true; settings: OrgPerformanceSettings }>(
    `/api/organizations/${encodeURIComponent(organizationId)}/performance-settings`,
  );
  return r.settings;
}

export async function updateOrganizationPerformanceSettingsBrowser(input: {
  organizationId: string;
  settings: OrgPerformanceSettings;
}): Promise<OrgPerformanceSettings> {
  const r = await apiJson<{ ok: true; settings: OrgPerformanceSettings }>(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/performance-settings`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input.settings),
    },
  );
  return r.settings;
}
