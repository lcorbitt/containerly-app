"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DASHBOARD_LINK_CLASS } from "../../constants";
import {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_PRIMARY_ORANGE,
  CHART_REPLY_BLUE,
  DASHBOARD_TIME_TO_RESOLVE_CHART_HEIGHT_CLASS,
  DASHBOARD_TIME_TO_RESOLVE_LEGEND_CLASS,
  DASHBOARD_TIME_TO_RESOLVE_LEGEND_SWATCH_CLASS,
  DASHBOARD_TIME_TO_RESOLVE_LOADING_CLASS,
  DASHBOARD_TIME_TO_RESOLVE_PANEL_BODY_CLASS,
  DASHBOARD_TIME_TO_RESOLVE_PANEL_CLASS,
  DASHBOARD_TIME_TO_RESOLVE_SUBTITLE_CLASS,
  DASHBOARD_TIME_TO_RESOLVE_TITLE_CLASS,
} from "./constants";
import type { DashboardTimeToResolveChartProps } from "./types";
import {
  buildTimeToResolveChartData,
  formatResolveHours,
  timeToResolveChartHasData,
} from "./utils";

export function DashboardTimeToResolveChart({
  series,
  loading = false,
}: DashboardTimeToResolveChartProps) {
  if (loading) {
    return (
      <section className={DASHBOARD_TIME_TO_RESOLVE_PANEL_CLASS} aria-busy="true">
        <div className={DASHBOARD_TIME_TO_RESOLVE_PANEL_BODY_CLASS}>
          <h2 className={DASHBOARD_TIME_TO_RESOLVE_TITLE_CLASS}>Time to Resolve</h2>
          <div className={DASHBOARD_TIME_TO_RESOLVE_LOADING_CLASS}>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>Loading…</span>
          </div>
        </div>
      </section>
    );
  }

  const data = buildTimeToResolveChartData(series);
  const hasData = series ? timeToResolveChartHasData(series) : false;

  return (
    <section className={DASHBOARD_TIME_TO_RESOLVE_PANEL_CLASS} aria-labelledby="dashboard-time-to-resolve-heading">
      <div className={`${DASHBOARD_TIME_TO_RESOLVE_PANEL_BODY_CLASS} flex h-full flex-col`}>
        <div>
          <h2 id="dashboard-time-to-resolve-heading" className={DASHBOARD_TIME_TO_RESOLVE_TITLE_CLASS}>
            Time to Resolve
          </h2>
          <p className={DASHBOARD_TIME_TO_RESOLVE_SUBTITLE_CLASS}>
            Median hours to acknowledge alerts and reply to customers
          </p>
        </div>

        {!data || !hasData ? (
          <p className="mt-5 flex flex-1 items-center text-sm text-zinc-500 dark:text-zinc-400">
            Resolve trends will appear as alerts are acknowledged and customers receive replies.
          </p>
        ) : (
          <>
            <div className={DASHBOARD_TIME_TO_RESOLVE_CHART_HEIGHT_CLASS}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardAlertAckFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_PRIMARY_ORANGE} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={CHART_PRIMARY_ORANGE} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="dashboardReplyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_REPLY_BLUE} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={CHART_REPLY_BLUE} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: CHART_AXIS_TICK, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: CHART_AXIS_TICK, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(9, 9, 11, 0.92)",
                      border: "1px solid rgba(63, 63, 70, 0.6)",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#fafafa" }}
                    formatter={(value, name) => [
                      formatResolveHours(typeof value === "number" ? value : null),
                      name === "alertAckMedianHours" ? "Alert Acknowledge" : "Customer Reply",
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ display: "none" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="alertAckMedianHours"
                    name="Alert Acknowledge"
                    stroke={CHART_PRIMARY_ORANGE}
                    strokeWidth={1.5}
                    fill="url(#dashboardAlertAckFill)"
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="replyMedianHours"
                    name="Customer Reply"
                    stroke={CHART_REPLY_BLUE}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={DASHBOARD_TIME_TO_RESOLVE_LEGEND_CLASS}>
              <span>
                <span
                  className={DASHBOARD_TIME_TO_RESOLVE_LEGEND_SWATCH_CLASS}
                  style={{ backgroundColor: CHART_PRIMARY_ORANGE }}
                />
                Alert Acknowledge
              </span>
              <span>
                <span
                  className={DASHBOARD_TIME_TO_RESOLVE_LEGEND_SWATCH_CLASS}
                  style={{ backgroundColor: CHART_REPLY_BLUE }}
                />
                Customer Reply
              </span>
            </div>
          </>
        )}

        <Link href="/reports" className={`${DASHBOARD_LINK_CLASS} mt-auto pt-4`}>
          View Reports
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
