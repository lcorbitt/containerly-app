"use client";

import { X } from "lucide-react";
import {
  SHIPMENT_TAG_CHIP_CLASS,
  SHIPMENT_TAG_INPUT_CLASS,
  SHIPMENT_TAG_REMOVE_BTN_CLASS,
  SHIPMENT_TAG_SUGGESTION_CLASS,
  SHIPMENT_TAG_SUGGESTIONS_LIST_ID,
  SHIPMENT_TAG_SUGGESTIONS_MAX,
} from "./constants";
import type { ShipmentTagsPanelState } from "./useShipmentTagsPanel";

export function ShipmentTagsPanel({ state }: { state: ShipmentTagsPanelState }) {
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
    <section aria-label="Shipment tags">
      <h3 className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Tags
      </h3>
      {tags.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
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
      ) : (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">No tags yet.</p>
      )}

      <div ref={containerRef} className="relative mt-2">
        <label className="sr-only" htmlFor="shipment-tag-input">
          Add tag
        </label>
        <input
          id="shipment-tag-input"
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
    </section>
  );
}
