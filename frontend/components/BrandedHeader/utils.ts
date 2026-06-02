import { displayInitialsFromName } from "@/utils/display-initials";

export function organizationInitials(name: string): string {
  return displayInitialsFromName(name);
}
