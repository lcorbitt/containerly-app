"use client";

import { X } from "lucide-react";
import { TextInput } from "@/components/TextInput";
import {
  SHIPMENT_TAG_CHIP_CLASS,
  SHIPMENT_TAG_INPUT_CLASS,
  SHIPMENT_TAG_REMOVE_BTN_CLASS,
  SHIPMENT_TAG_SUGGESTION_CLASS,
  SHIPMENT_TAG_SUGGESTIONS_LIST_ID,
  SHIPMENT_TAG_SUGGESTIONS_MAX,
} from "./constants";
import { SIDEBAR_SETTINGS_POPOVER_HINT_CLASS } from "../ShipmentSidebarSettingsRow/constants";
import type { ShipmentTagsPanelState } from "./useShipmentTagsPanel";

export function ShipmentTagsEditor({ state }: { state: ShipmentTagsPanelState }) {
  const {
    tags,
    draft,
    saving,
    showSuggestions,
    suggestions,
    containerRef,
    handleInputFocus,
    handleInputChange,
    handleInputBlur,
    addTag,
    removeTag,
    handleInputKeyDown,
  } = state;

  const suggestionsId = SHIPMENT_TAG_SUGGESTIONS_LIST_ID;

  return (
    <div aria-label="Edit shipment tags">
      <p className={SIDEBAR_SETTINGS_POPOVER_HINT_CLASS}>Add labels to organize and filter shipments.</p>
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag}>
              <span className={SHIPMENT_TAG_CHIP_CLASS} title={tag}>
                <span className="max-w-32 truncate">{tag}</span>
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  disabled={saving}
                  onClick={() => void removeTag(tag)}
                  className={SHIPMENT_TAG_REMOVE_BTN_CLASS}
                >
                  <X className="h-3 w-3" strokeWidth={2} aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div ref={containerRef} className={tags.length > 0 ? "relative mt-2" : "relative"}>
        <label className="sr-only" htmlFor="shipment-tag-input">
          Add tag
        </label>
        <TextInput
          id="shipment-tag-input"
          data-sidebar-popover-focus
          value={draft}
          disabled={saving}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Add tag…"
          className={SHIPMENT_TAG_INPUT_CLASS}
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={showSuggestions ? suggestionsId : undefined}
          aria-autocomplete="list"
        />
        {showSuggestions ? (
          <ul
            id={suggestionsId}
            className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
            role="listbox"
            aria-label="Existing organization tags"
          >
            {suggestions.slice(0, SHIPMENT_TAG_SUGGESTIONS_MAX).map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className={SHIPMENT_TAG_SUGGESTION_CLASS}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void addTag(tag)}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
