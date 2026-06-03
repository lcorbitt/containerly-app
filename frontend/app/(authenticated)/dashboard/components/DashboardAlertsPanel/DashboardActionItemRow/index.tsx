import Link from "next/link";
import {
  DASHBOARD_ACTION_ITEM_DETAIL_CLASS,
  DASHBOARD_ACTION_ITEM_META_CLASS,
  DASHBOARD_ACTION_ITEM_ROUTE_CLASS,
  DASHBOARD_ACTION_ITEM_ROW_CLASS,
  DASHBOARD_ACTION_ITEM_SECONDARY_CLASS,
  DASHBOARD_ACTION_ITEM_TITLE_CLASS,
} from "./constants";
import type { DashboardActionItemRowProps } from "./types";
import {
  DASHBOARD_ALERTS_TAG_CLASS,
  DASHBOARD_ALERTS_TAG_CRITICAL_CLASS,
  DASHBOARD_ALERTS_TAG_INFO_CLASS,
  DASHBOARD_ALERTS_TAG_WARNING_CLASS,
} from "../constants";
import { formatActionItemMetaLine, primaryActionItemTitle } from "../utils";

function tagClass(severity: "critical" | "warning" | "info"): string {
  switch (severity) {
    case "critical":
      return DASHBOARD_ALERTS_TAG_CRITICAL_CLASS;
    case "warning":
      return DASHBOARD_ALERTS_TAG_WARNING_CLASS;
    default:
      return DASHBOARD_ALERTS_TAG_INFO_CLASS;
  }
}

export function DashboardActionItemRow({ item }: DashboardActionItemRowProps) {
  const title = primaryActionItemTitle(item);
  const metaLine = formatActionItemMetaLine(item);

  return (
    <Link href={`/containers/${item.containerId}`} className={DASHBOARD_ACTION_ITEM_ROW_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={DASHBOARD_ACTION_ITEM_TITLE_CLASS}>{title}</p>
          {item.orderNumber?.trim() ? (
            <p className={DASHBOARD_ACTION_ITEM_SECONDARY_CLASS}>{item.containerNumber}</p>
          ) : null}
          {metaLine ? <p className={DASHBOARD_ACTION_ITEM_META_CLASS}>{metaLine}</p> : null}
          {item.routeLine ? <p className={DASHBOARD_ACTION_ITEM_ROUTE_CLASS}>{item.routeLine}</p> : null}
          <p className={DASHBOARD_ACTION_ITEM_DETAIL_CLASS}>{item.detail}</p>
        </div>
        <span className={`${DASHBOARD_ALERTS_TAG_CLASS} ${tagClass(item.severity)}`}>{item.tagLabel}</span>
      </div>
    </Link>
  );
}
