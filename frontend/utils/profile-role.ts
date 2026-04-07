export type { ProfileRole } from "@/types/database";

export function isSuperadminRole(role: string | null | undefined): boolean {
  return role === "superadmin";
}
