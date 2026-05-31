import { Pencil } from "lucide-react";

const actionClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900";

export function ShipmentHeaderActions({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onEdit} className={actionClass} aria-label="Edit shipment details">
        <Pencil className="h-3.5 w-3.5 opacity-70" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
