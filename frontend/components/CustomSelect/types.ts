export type CustomSelectOption = {
  value: string;
  label: string;
  /** Resolved public URL for `profiles.profile_image_path`, or null for placeholder initial. */
  avatarUrl?: string | null;
};
