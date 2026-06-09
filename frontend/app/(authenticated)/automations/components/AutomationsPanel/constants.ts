export const AUTOMATIONS_RULE_CARD_CLASS =
  "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

export const AUTOMATIONS_GROWTH_BADGE_CLASS =
  "inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800 dark:bg-violet-950/60 dark:text-violet-200";

export const AUTOMATION_RULE_TEMPLATES = [
  {
    id: "delay-notify",
    title: "Notify On Delays",
    description:
      "When a carrier milestone slips, subscribers and shipment owners get an alert with shipment context — not a detached FYI email.",
    settingKey: "sla_response_hours" as const,
  },
  {
    id: "stale-data",
    title: "Surface Stale Data",
    description:
      "Flag the team when tracking or document status has not refreshed within your stale-update window.",
    settingKey: "stale_update_reminder_hours" as const,
  },
  {
    id: "required-docs",
    title: "Required Document Checklist",
    description:
      "Block approval routing until required document types are attached to the shipment record.",
    settingKey: "required_document_types" as const,
  },
] as const;
