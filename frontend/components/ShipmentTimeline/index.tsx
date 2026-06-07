"use client";

import { ArrowDownUp, MapPin } from "lucide-react";
import type {
  ShipmentTimelineProps,
  ShipmentTimelineOrder,
  ShipmentTimelineViewProps,
} from "./types";
import {
  TONE_STYLES,
  STEP_CARD_BASE,
  STEP_CARD_SURFACE,
  STEP_CARD_SURFACE_PAST,
  TIMELINE_CARD_TIMESTAMP_CLASS,
  TIMELINE_COMMUNICATION_PREVIEW_CLASS,
  TIMELINE_CONNECTOR_PAST_CLASS,
  TIMELINE_DEFAULT_SUBTITLE_CLASS,
  TIMELINE_LATEST_NODE_CLASS,
  TIMELINE_LATEST_TIMESTAMP_CLASS,
  TIMELINE_PAST_NODE_CLASS,
} from "./constants";
import {
  buildShipmentTimelineEvents,
  formatTimelineWhen,
  eventHeading,
  getLatestTimelineEventId,
  inferTimelineVisual,
  isCommunicationTimelineEvent,
  communicationTimelinePreview,
  formatLocationSnippet,
  timelineEventElementId,
} from "./utils";
import { useShipmentTimelineOrder } from "./useShipmentTimeline";
import { useShipmentTimelineScrollToLatest } from "./useShipmentTimelineScrollToLatest";
import { TimelineDocumentMeta } from "./TimelineDocumentMeta";

export type {
  ShipmentTimelineProps,
  ShipmentTimelineOrder,
  ShipmentTimelineViewProps,
  ContainerTimelineProps,
  ContainerTimelineOrder,
  ContainerTimelineViewProps,
} from "./types";
export type { TimelineTone } from "./types";
export { formatTimelineWhen, buildShipmentTimelineEvents, getLatestTimelineEventId, scrollTimelineEventIntoView } from "./utils";
export { useShipmentTimelineOrder, useContainerTimelineOrder } from "./useShipmentTimeline";
export { useShipmentTimelineScrollToLatest } from "./useShipmentTimelineScrollToLatest";

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

export function ShipmentTimelineView({
  order,
  className: classNameProp,
  emptyMessage = "No events recorded yet",
  emptyHint = "Shipment milestones and carrier updates will appear here.",
  scrollToLatestNonce,
}: ShipmentTimelineViewProps) {
  const { displayEvents, orderFadeOut } = order;
  const eventCount = displayEvents.length;
  const latestEventId = getLatestTimelineEventId(displayEvents);

  useShipmentTimelineScrollToLatest({ displayEvents, scrollToLatestNonce });

  return (
    <section
      className={`overflow-x-hidden shadow-sm ${classNameProp ?? ""}`}
      aria-label="Journey timeline"
    >
      <div className="p-3 sm:p-4">
        {eventCount === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <MapPin className="h-8 w-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.25} aria-hidden />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{emptyMessage}</p>
            <p className="max-w-xs text-xs text-zinc-500 dark:text-zinc-500">{emptyHint}</p>
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
                const { tone, Icon, label } = inferTimelineVisual(
                  ev.event_type,
                  ev.status,
                  ev.activityMetadata,
                );
                const s = TONE_STYLES[tone];
                const isLast = index === displayEvents.length - 1;
                const isLatest = ev.id === latestEventId;
                const isPast = !isLatest;
                const nextIsLatest = displayEvents[index + 1]?.id === latestEventId;
                const { title, subtitle } = eventHeading(ev);
                const isCommunication = isCommunicationTimelineEvent(ev.event_type);
                const communicationPreview = isCommunication
                  ? communicationTimelinePreview(subtitle)
                  : null;
                const locSnippet =
                  ev.location && Object.keys(ev.location).length > 0
                    ? formatLocationSnippet(ev.location)
                    : null;

                return (
                  <li
                    key={ev.id}
                    id={timelineEventElementId(ev.id)}
                    className="group mb-8 last:mb-0 scroll-mt-24"
                    aria-current={isLatest ? "step" : undefined}
                  >
                    <div className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3">
                      {index > 0 ? (
                        <span
                          className={`pointer-events-none absolute -top-8 bottom-1/2 left-[1.25rem] z-0 w-px -translate-x-1/2 ${
                            isLatest ? s.connector : TIMELINE_CONNECTOR_PAST_CLASS
                          }`}
                          aria-hidden
                        />
                      ) : null}
                      {!isLast ? (
                        <span
                          className={`pointer-events-none absolute top-1/2 -bottom-8 left-[1.25rem] z-0 w-px -translate-x-1/2 ${
                            nextIsLatest ? s.connector : TIMELINE_CONNECTOR_PAST_CLASS
                          }`}
                          aria-hidden
                        />
                      ) : null}
                      <div className="relative z-10 flex justify-center">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-white transition-[transform,opacity,box-shadow] duration-200 motion-safe:group-hover:scale-[1.03] dark:ring-offset-zinc-950 ${s.node} ${
                            isLatest ? `${s.iconGlow} ${TIMELINE_LATEST_NODE_CLASS}` : TIMELINE_PAST_NODE_CLASS
                          }`}
                          aria-hidden
                        >
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                        </div>
                      </div>
                      <div className="relative z-10 min-w-0">
                        <div
                          className={`${STEP_CARD_BASE} w-full max-w-none ${
                            isLatest ? s.latestCard : isPast ? STEP_CARD_SURFACE_PAST : STEP_CARD_SURFACE
                          }`}
                        >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex max-w-full items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                isPast ? "opacity-75" : ""
                              } ${s.chip}`}
                            >
                              {label}
                            </span>
                          </div>
                          <time
                            dateTime={ev.occurred_at}
                            className={isLatest ? TIMELINE_LATEST_TIMESTAMP_CLASS : TIMELINE_CARD_TIMESTAMP_CLASS}
                          >
                            {formatTimelineWhen(ev.occurred_at)}
                          </time>
                        </div>
                        <p
                          className={`leading-snug ${
                            isLatest
                              ? "text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                              : "text-[13px] font-medium text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {title}
                        </p>
                        {communicationPreview ? (
                          <p className={TIMELINE_COMMUNICATION_PREVIEW_CLASS}>{communicationPreview}</p>
                        ) : subtitle ? (
                          <p className={TIMELINE_DEFAULT_SUBTITLE_CLASS}>{subtitle}</p>
                        ) : null}
                        {ev.documentMeta ? <TimelineDocumentMeta meta={ev.documentMeta} /> : null}
                        {locSnippet || (ev.location && Object.keys(ev.location).length > 0) ? (
                          <div className="border-t border-zinc-200/50 pt-1.5 dark:border-zinc-700/50">
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
                        </div>
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

export function ShipmentTimeline(props: ShipmentTimelineProps) {
  const mergedEvents = buildShipmentTimelineEvents({
    carrierEvents: props.events ?? [],
    activityEvents: props.activityEvents ?? [],
    attachmentDisplayNamesById: props.attachmentDisplayNamesById,
  });
  const order = useShipmentTimelineOrder(mergedEvents);
  return <ShipmentTimelineView {...props} order={order} />;
}

/** @deprecated Use ShipmentTimeline */
export const ContainerTimeline = ShipmentTimeline;
/** @deprecated Use ShipmentTimelineView */
export const ContainerTimelineView = ShipmentTimelineView;
