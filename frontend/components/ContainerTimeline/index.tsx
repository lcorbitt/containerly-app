"use client";

import {
  ArrowDownUp,
  Clock,
  Code2,
  MapPin,
  Route,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import type { PublicTimelineEvent } from "@/types/public-report";
import type {
  ContainerTimelineProps,
  ContainerTimelineOrder,
  ContainerTimelineViewProps,
} from "./types";
import { TONE_STYLES, STEP_CARD_BASE, STEP_CARD_INTERACTIVE } from "./constants";
import {
  formatTimelineWhen,
  formatIsoUtc,
  formatRelativeWhen,
  humanizeCarrierToken,
  humanizeFieldKey,
  eventHeading,
  inferTimelineVisual,
  formatValueForDisplay,
  formatLocationSnippet,
} from "./utils";
import { useContainerTimelineOrder } from "./hooks/useContainerTimeline";

export type { ContainerTimelineProps, ContainerTimelineOrder, ContainerTimelineViewProps } from "./types";
export type { TimelineTone } from "./types";
export { formatTimelineWhen } from "./utils";
export { useContainerTimelineOrder } from "./hooks/useContainerTimeline";

function LocationDetails({
  location,
  compact,
}: {
  location: Record<string, unknown> | null;
  compact?: boolean;
}) {
  if (!location || Object.keys(location).length === 0) {
    return (
      <p className={compact ? "text-xs text-zinc-400" : "text-xs text-zinc-500 dark:text-zinc-400"}>
        {compact ? "None" : "No location on this update."}
      </p>
    );
  }
  const entries = Object.entries(location).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (compact) {
    return (
      <dl className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-xs">
            <dt className="w-24 shrink-0 text-zinc-500">{humanizeFieldKey(k)}</dt>
            <dd className="min-w-0 wrap-break-word font-mono text-[11px] text-zinc-200">
              {formatValueForDisplay(v)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  const multiline = (v: unknown) =>
    typeof v === "object" && v !== null && (Array.isArray(v) ? true : Object.keys(v as object).length > 0);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div
          key={k}
          className={`rounded-lg border border-zinc-100 bg-zinc-50/90 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50 ${multiline(v) ? "sm:col-span-2" : ""}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {humanizeFieldKey(k)}
          </p>
          <p className="mt-1 wrap-break-word font-mono text-[12px] leading-relaxed text-zinc-800 dark:text-zinc-200">
            {formatValueForDisplay(v)}
          </p>
        </div>
      ))}
    </div>
  );
}

function TimelineEventDetailModal({
  event,
  onClose,
}: {
  event: PublicTimelineEvent;
  onClose: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const onBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const { tone, Icon, label } = inferTimelineVisual(event.event_type, event.status);
  const s = TONE_STYLES[tone];
  const { title, subtitle } = eventHeading(event);
  const relative = formatRelativeWhen(event.occurred_at);
  const rawPayload = event.raw_payload;
  const hasRaw =
    rawPayload != null && typeof rawPayload === "object" && Object.keys(rawPayload).length > 0;
  let rawJson = "";
  if (hasRaw) {
    try {
      rawJson = JSON.stringify(rawPayload, null, 2);
    } catch {
      rawJson = String(rawPayload);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={onBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(85dvh,620px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-[0_1px_0_0_rgba(255,255,255,0.06)] sm:rounded-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
          <p className="text-lg font-medium text-white">Event Details</p>
          <DialogCloseButton tone="inverse" onClick={onClose} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${s.modalStatusIcon}`}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.modalChip}`}
                >
                  {label}
                </span>
                <span className="text-[11px] font-medium text-zinc-500">{relative}</span>
              </div>
              <h2 id={titleId} className="mt-1.5 text-base font-semibold leading-snug tracking-tight text-zinc-50">
                {title}
              </h2>
              {subtitle ? <p className="mt-0.5 text-xs font-medium text-zinc-400">{subtitle}</p> : null}
            </div>
          </div>

          <div className="mt-3 divide-y divide-zinc-800">
            <div className="pb-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">When</p>
              <p className="text-sm font-medium text-zinc-100">{formatTimelineWhen(event.occurred_at)}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                  {relative}
                </span>
                <span className="mx-1.5 text-zinc-600">·</span>
                <code className="font-mono text-[10px] text-zinc-500">{formatIsoUtc(event.occurred_at)}</code>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 py-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Event type</p>
                <p className="mt-0.5 font-mono text-xs text-zinc-100">{event.event_type}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Status</p>
                {event.status ? (
                  <p className="mt-0.5 text-xs text-zinc-100">
                    <span className="font-medium">{humanizeCarrierToken(event.status)}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-zinc-500">{event.status}</span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-zinc-500">—</p>
                )}
              </div>
            </div>

            <div className="py-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Location</p>
              <LocationDetails compact location={event.location} />
            </div>

            <div className="grid grid-cols-1 gap-2 py-2.5 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Event ID</p>
                <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-300">{event.id}</p>
              </div>
              {event.created_at ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Logged at</p>
                  <p className="mt-0.5 text-xs text-zinc-200">{formatTimelineWhen(event.created_at)}</p>
                  <code className="mt-0.5 block break-all font-mono text-[10px] text-zinc-500">
                    {formatIsoUtc(event.created_at)}
                  </code>
                </div>
              ) : null}
              {event.container_id ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Container ID</p>
                  <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-300">{event.container_id}</p>
                </div>
              ) : null}
              {event.tracking_request_id ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Tracking request
                  </p>
                  <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-300">{event.tracking_request_id}</p>
                </div>
              ) : null}
            </div>

            {hasRaw ? (
              <details className="group pt-2.5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-zinc-300">
                  <Code2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
                  Raw provider payload
                  <span className="text-[10px] font-normal text-zinc-500">(expand)</span>
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-2 font-mono text-[10px] leading-relaxed text-zinc-300">
                  {rawJson}
                </pre>
              </details>
            ) : null}
          </div>

          {!hasRaw && !event.created_at && !event.container_id ? (
            <p className="mt-2 text-center text-[11px] leading-snug text-zinc-500">
              Shared link: only public fields are shown.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}

function TimelineStepCard({
  interactive,
  onOpenDetail,
  className,
  children,
}: {
  interactive: boolean;
  onOpenDetail: () => void;
  className: string;
  children: ReactNode;
}) {
  if (interactive) {
    return (
      <button
        type="button"
        onClick={onOpenDetail}
        className={`${STEP_CARD_BASE} ${STEP_CARD_INTERACTIVE} ${className}`}
      >
        {children}
      </button>
    );
  }
  return <div className={`${STEP_CARD_BASE} ${className}`}>{children}</div>;
}

export function TimelineOrderToggle({
  newestFirst,
  onToggle,
}: {
  newestFirst: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={newestFirst}
      aria-label={
        newestFirst
          ? "Timeline order: new to old. Activate to show old to new."
          : "Timeline order: old to new. Activate to show new to old."
      }
      title={newestFirst ? "Show old to new" : "Show new to old"}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <ArrowDownUp className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      <span className="hidden sm:inline">{newestFirst ? "New → Old" : "Old → New"}</span>
      <span className="sm:hidden">Order</span>
    </button>
  );
}

export function ContainerTimelineView({
  events,
  order,
  interactiveDetail = true,
  hideHeader = false,
  showOrderToggle = true,
  className: classNameProp,
}: ContainerTimelineViewProps) {
  const { displayEvents, orderFadeOut, newestFirst, handleOrderToggle } = order;
  const [detailEvent, setDetailEvent] = useState<PublicTimelineEvent | null>(null);

  return (
    <section
      className={`overflow-x-hidden shadow-sm ${classNameProp ?? ""}`}
      aria-label="Journey timeline"
    >
      {interactiveDetail && detailEvent ? (
        <TimelineEventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />
      ) : null}

      {hideHeader ? null : (
        <div className="border-b border-zinc-100 bg-transparent px-4 py-3.5 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-400/70 bg-transparent text-zinc-600 dark:border-zinc-500 dark:text-zinc-400">
                <Route className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {events.length > 0 && showOrderToggle ? (
                <TimelineOrderToggle newestFirst={newestFirst} onToggle={handleOrderToggle} />
              ) : null}
              {events.length > 0 ? (
                <span className="rounded-full border border-zinc-200/80 bg-white px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                  {events.length} event{events.length !== 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className={`p-3 sm:p-4 ${hideHeader ? "pt-3 sm:pt-4" : ""}`}>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <MapPin className="h-8 w-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.25} aria-hidden />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No events recorded yet</p>
            <p className="max-w-xs text-xs text-zinc-500 dark:text-zinc-500">
              Synced carrier updates will appear here as your shipment moves.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div
              className={`motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none ${
                orderFadeOut ? "opacity-0" : "opacity-100"
              }`}
            >
            <ol className="relative list-none py-1">
              {displayEvents.map((ev, index) => {
                const { tone, Icon, label } = inferTimelineVisual(ev.event_type, ev.status);
                const s = TONE_STYLES[tone];
                const isLast = index === displayEvents.length - 1;
                const relative = formatRelativeWhen(ev.occurred_at);
                const { title, subtitle } = eventHeading(ev);
                const locSnippet =
                  ev.location && Object.keys(ev.location).length > 0
                    ? formatLocationSnippet(ev.location)
                    : null;

                return (
                  <li key={ev.id} className="group mb-8 last:mb-0">
                    <div className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3">
                      {index > 0 ? (
                        <span
                          className="pointer-events-none absolute -top-8 bottom-1/2 left-[1.25rem] z-0 w-px -translate-x-1/2 bg-zinc-200 dark:bg-zinc-700"
                          aria-hidden
                        />
                      ) : null}
                      {!isLast ? (
                        <span
                          className="pointer-events-none absolute top-1/2 -bottom-8 left-[1.25rem] z-0 w-px -translate-x-1/2 bg-zinc-200 dark:bg-zinc-700"
                          aria-hidden
                        />
                      ) : null}
                      <div className="relative z-10 flex justify-center">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-white transition-[transform,box-shadow] duration-200 motion-safe:group-hover:scale-[1.03] dark:ring-offset-zinc-950 ${s.node} ${s.iconGlow}`}
                          aria-hidden
                        >
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                        </div>
                      </div>
                      <div className="relative z-10 min-w-0">
                        <TimelineStepCard
                          interactive={interactiveDetail}
                          onOpenDetail={() => setDetailEvent(ev)}
                          className={`w-full max-w-none ${s.cardBorder} ${s.cardBg}`}
                        >
                        <div className="flex flex-wrap items-center gap-1 gap-y-0.5">
                          <span
                            className={`inline-flex max-w-full items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.chip}`}
                          >
                            {label}
                          </span>
                          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                            {relative}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                          {title}
                        </p>
                        {subtitle ? (
                          <p className="mt-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                            {subtitle}
                          </p>
                        ) : null}
                        <p className="mt-1 font-mono text-[10px] leading-tight text-zinc-500 dark:text-zinc-500">
                          {formatTimelineWhen(ev.occurred_at)}
                        </p>
                        {locSnippet || (ev.location && Object.keys(ev.location).length > 0) ? (
                          <div className="mt-1.5 border-t border-zinc-200/50 pt-1.5 dark:border-zinc-700/50">
                            {locSnippet ? (
                              <p className="flex items-start gap-1 text-[10px] leading-snug text-zinc-600 dark:text-zinc-400">
                                <MapPin
                                  className="mt-0.5 h-2.5 w-2.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                <span className="line-clamp-3">{locSnippet}</span>
                              </p>
                            ) : (
                              <p className="line-clamp-2 font-mono text-[9px] leading-snug text-zinc-600 dark:text-zinc-400">
                                {JSON.stringify(ev.location)}
                              </p>
                            )}
                          </div>
                        ) : null}
                        </TimelineStepCard>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function ContainerTimeline(props: ContainerTimelineProps) {
  const order = useContainerTimelineOrder(props.events);
  return <ContainerTimelineView {...props} order={order} />;
}
