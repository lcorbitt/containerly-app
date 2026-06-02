export const SHIPMENT_THREAD_EMPTY_STATE_TEXT = "No messages yet.";

export function ShipmentThreadStartBanner({ shipmentLabel }: { shipmentLabel: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-ibold text-zinc-900 dark:text-zinc-50">
        Welcome to
        {shipmentLabel ? (
          <span className="font-bold">
            {" "}
            Order No. <span className="font-mono">{shipmentLabel}</span>. This is your direct message
            thread.
          </span>
        ) : null}
      </p>
    </div>
  );
}
