import type { Profile } from "@/types/database";

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export const ROLE_OPTIONS: Profile["role"][] = ["user", "superadmin"];
