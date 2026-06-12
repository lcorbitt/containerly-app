export const SIGNUP_ORG_TEAM_SIZE_OPTIONS = [
  { value: "", label: "Select team size" },
  { value: "1", label: "Just Me" },
  { value: "2-10", label: "2–10" },
  { value: "11-50", label: "11–50" },
  { value: "51-200", label: "51–200" },
  { value: "200+", label: "200+" },
] as const;

export const SIGNUP_ORG_SHIPMENT_VOLUME_OPTIONS = [
  { value: "", label: "Select volume" },
  { value: "0-10", label: "0–10" },
  { value: "11-50", label: "11–50" },
  { value: "51-200", label: "51–200" },
  { value: "200+", label: "200+" },
] as const;

export const SIGNUP_ORG_SUBMIT_LABEL = "Continue";

export const SIGNUP_ORG_TEAM_NAME_LABEL = "Team Name";

export const SIGNUP_ORG_TEAM_SIZE_LABEL = "How Big Is Your Team?";

export const SIGNUP_ORG_SHIPMENT_VOLUME_LABEL = "How Many Shipments Do You Move Per Month?";

export const SIGNUP_ORG_FIELD_LABEL_CLASS =
  "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

export const SIGNUP_ORG_SELECT_CLASS =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 transition-[border-color,box-shadow] focus:border-primary-orange/45 focus:outline-none focus:ring-2 focus:ring-primary-orange/15 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-primary-orange/55 dark:focus:ring-primary-orange/20";

export const SIGNUP_ORG_TEXT_INPUT_CLASS =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-primary-orange/45 focus:outline-none focus:ring-2 focus:ring-primary-orange/15 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-orange/55 dark:focus:ring-primary-orange/20";
