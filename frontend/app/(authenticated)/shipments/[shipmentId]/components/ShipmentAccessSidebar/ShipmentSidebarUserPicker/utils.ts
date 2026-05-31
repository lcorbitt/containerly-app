import type { CustomSelectOption } from "@/components/CustomSelect";

export function filterSidebarUserOptions(
  options: CustomSelectOption[],
  query: string,
): CustomSelectOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;
  return options.filter((option) => option.label.toLowerCase().includes(normalized));
}
