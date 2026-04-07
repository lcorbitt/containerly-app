import type { PublicTimelineEvent } from "@/types/public-report";

export type TimelineTone = "vessel" | "port" | "land" | "customs" | "system" | "milestone";

export type ContainerTimelineProps = {
  events: PublicTimelineEvent[];
  /** When false, cards are not clickable (public report). Default true for team views. */
  interactiveDetail?: boolean;
  /** Omit the titled header row when embedding inside another shell (e.g. tabbed request page). */
  hideHeader?: boolean;
  /** When false, hides the new→old / old→new order toggle. Default true. */
  showOrderToggle?: boolean;
  /** Merged onto the outer section (e.g. `rounded-none border-0` inside a tab panel). */
  className?: string;
};

export type ContainerTimelineOrder = {
  newestFirst: boolean;
  displayEvents: PublicTimelineEvent[];
  orderFadeOut: boolean;
  handleOrderToggle: () => void;
};

export type ContainerTimelineViewProps = ContainerTimelineProps & {
  order: ContainerTimelineOrder;
};
