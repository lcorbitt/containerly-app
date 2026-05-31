"use client";

import { Check } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { CustomSelectOption } from "@/components/CustomSelect";
import { TextInput } from "@/components/TextInput";
import { UserAvatar } from "@/components/UserAvatar";
import {
  SIDEBAR_SETTINGS_POPOVER_HINT_CLASS,
  SIDEBAR_SETTINGS_POPOVER_SECTION_LABEL_CLASS,
  SIDEBAR_SETTINGS_SEARCH_INPUT_CLASS,
  SIDEBAR_SETTINGS_USER_LIST_CLASS,
  SIDEBAR_SETTINGS_USER_OPTION_CLASS,
} from "../ShipmentSidebarSettingsRow/constants";
import { filterSidebarUserOptions } from "./utils";

export function ShipmentSidebarUserPicker({
  hint,
  searchPlaceholder = "Type or choose a user",
  options,
  selectedValue,
  disabled = false,
  onPick,
}: {
  hint: string;
  searchPlaceholder?: string;
  options: CustomSelectOption[];
  selectedValue?: string | null;
  disabled?: boolean;
  onPick: (userId: string) => void;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const filteredOptions = useMemo(
    () => filterSidebarUserOptions(options, query),
    [options, query],
  );

  return (
    <div>
      <p className={SIDEBAR_SETTINGS_POPOVER_HINT_CLASS}>{hint}</p>
      <label className="sr-only" htmlFor={inputId}>
        {searchPlaceholder}
      </label>
      <TextInput
        id={inputId}
        data-sidebar-popover-focus
        type="search"
        value={query}
        disabled={disabled}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder}
        className={SIDEBAR_SETTINGS_SEARCH_INPUT_CLASS}
        autoComplete="off"
        role="searchbox"
      />
      <p className={SIDEBAR_SETTINGS_POPOVER_SECTION_LABEL_CLASS}>Suggestions</p>
      {filteredOptions.length > 0 ? (
        <ul className={SIDEBAR_SETTINGS_USER_LIST_CLASS} role="listbox" aria-label="Suggestions">
          {filteredOptions.map((option) => {
            const selected = selectedValue === option.value;
            const showAvatar = Boolean(option.value);
            return (
              <li key={option.value === "" ? "__empty" : option.value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={disabled}
                  className={SIDEBAR_SETTINGS_USER_OPTION_CLASS(selected)}
                  onClick={() => onPick(option.value)}
                >
                  {showAvatar ? (
                    <UserAvatar imageUrl={option.avatarUrl ?? null} label={option.label} size="md" />
                  ) : (
                    <span className="h-8 w-8 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-300" strokeWidth={2} aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No matches.</p>
      )}
    </div>
  );
}
