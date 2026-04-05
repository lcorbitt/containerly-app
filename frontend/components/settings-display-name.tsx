"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/toast";
import { createClient } from "@/lib/supabase/client";

const MAX_LEN = 200;

export function SettingsDisplayName({
  userId,
  initialFullName,
}: {
  userId: string;
  initialFullName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(initialFullName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(initialFullName);
  }, [initialFullName]);

  const trimmed = value.trim();
  const initialTrimmed = initialFullName.trim();
  const unchanged = trimmed === initialTrimmed;

  async function save() {
    if (trimmed.length > MAX_LEN) {
      toast(`Name is too long (max ${MAX_LEN} characters).`, "error");
      return;
    }
    if (unchanged) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: trimmed.length > 0 ? trimmed : null })
        .eq("id", userId);
      if (error) throw new Error(error.message);
      toast("Name updated", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update name", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label htmlFor="settings-display-name" className="text-zinc-500 dark:text-zinc-500">
        Name
      </label>
      <div className="mt-0.5 flex max-w-md flex-col gap-2 sm:flex-row sm:items-center">
        <input
          id="settings-display-name"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void save();
            }
          }}
          maxLength={MAX_LEN}
          autoComplete="name"
          placeholder="Your name"
          disabled={saving}
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none ring-zinc-400/30 placeholder:text-zinc-400 focus:ring-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <button
          type="button"
          disabled={saving || unchanged}
          onClick={() => void save()}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
