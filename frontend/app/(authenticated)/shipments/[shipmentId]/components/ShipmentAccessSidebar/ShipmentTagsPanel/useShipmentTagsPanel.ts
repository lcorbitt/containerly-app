"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import { updateShipmentTags } from "@/services/shipment.service";
import {
  mergeShipmentTags,
  removeShipmentTag,
  SHIPMENT_TAG_MAX_COUNT,
} from "@/utils/shipment-tags";
import { filterTagSuggestions, hasTagSuggestions, tagFromDraftInput } from "./utils";

export function useShipmentTagsPanel({
  shipmentId,
  initialTags,
  orgTagSuggestions,
  onTagsChanged,
}: {
  shipmentId: string;
  initialTags: string[];
  orgTagSuggestions: string[];
  onTagsChanged?: (savedTags: string[]) => void;
}) {
  const { toast } = useToast();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [tags, setTags] = useState(initialTags);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const suppressOpenRef = useRef(false);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags, shipmentId]);

  const persistTags = useCallback(
    async (nextTags: string[]) => {
      if (!selectedOrgId) return;
      setSaving(true);
      try {
        const saved = await updateShipmentTags({
          shipmentId,
          organizationId: selectedOrgId,
          tags: nextTags,
        });
        setTags(saved);
        onTagsChanged?.(saved);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not update tags", "error");
        setTags(initialTags);
      } finally {
        setSaving(false);
      }
    },
    [initialTags, onTagsChanged, selectedOrgId, shipmentId, toast],
  );

  const suggestions = useMemo(
    () => filterTagSuggestions(orgTagSuggestions, tags, draft),
    [draft, orgTagSuggestions, tags],
  );

  const showSuggestions = suggestionsOpen && suggestions.length > 0 && !saving;

  const closeSuggestionsMenu = useCallback(() => {
    setSuggestionsOpen(false);
  }, []);

  const dismissSuggestions = useCallback(() => {
    suppressOpenRef.current = true;
    closeSuggestionsMenu();
    const input = containerRef.current?.querySelector("input");
    if (input instanceof HTMLInputElement) input.blur();
    window.setTimeout(() => {
      suppressOpenRef.current = false;
    }, 0);
  }, [closeSuggestionsMenu]);

  const openSuggestionsIfAvailable = useCallback(
    (query: string) => {
      if (suppressOpenRef.current || saving) return;
      setSuggestionsOpen(hasTagSuggestions(orgTagSuggestions, tags, query));
    },
    [orgTagSuggestions, saving, tags],
  );

  useEffect(() => {
    if (!showSuggestions) return;

    function handlePointerDown(event: MouseEvent) {
      const container = containerRef.current;
      if (!container || container.contains(event.target as Node)) return;
      dismissSuggestions();
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [dismissSuggestions, showSuggestions]);

  useEffect(() => {
    if (suggestionsOpen && (suggestions.length === 0 || saving)) {
      setSuggestionsOpen(false);
    }
  }, [saving, suggestions.length, suggestionsOpen]);

  const handleInputFocus = useCallback(() => {
    openSuggestionsIfAvailable(draft);
  }, [draft, openSuggestionsIfAvailable]);

  const handleInputChange = useCallback(
    (value: string) => {
      setDraft(value);
      openSuggestionsIfAvailable(value);
    },
    [openSuggestionsIfAvailable],
  );

  const handleInputBlur = useCallback(() => {
    closeSuggestionsMenu();
  }, [closeSuggestionsMenu]);

  async function addTag(raw: string) {
    const tag = tagFromDraftInput(raw);
    if (!tag) {
      if (raw.trim()) {
        toast("Use letters, numbers, spaces, hyphens, or underscores (max 40 characters).", "error");
      }
      return;
    }
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      closeSuggestionsMenu();
      return;
    }
    if (tags.length >= SHIPMENT_TAG_MAX_COUNT) {
      toast(`Maximum ${SHIPMENT_TAG_MAX_COUNT} tags per shipment.`, "error");
      return;
    }
    const next = mergeShipmentTags(tags, [tag]);
    suppressOpenRef.current = true;
    setDraft("");
    closeSuggestionsMenu();
    setTags(next);
    await persistTags(next);
    suppressOpenRef.current = false;
  }

  async function removeTag(tag: string) {
    const next = removeShipmentTag(tags, tag);
    setTags(next);
    await persistTags(next);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      dismissSuggestions();
      return;
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      void addTag(draft);
    }
  }

  return {
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
  };
}

export type ShipmentTagsPanelState = ReturnType<typeof useShipmentTagsPanel>;
