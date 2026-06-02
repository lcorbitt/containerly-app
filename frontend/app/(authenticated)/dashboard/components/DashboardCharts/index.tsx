"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_AXIS_TICK,
  CHART_BAR_COLORS,
  CHART_GRID_STROKE,
  CHART_PRIMARY_ORANGE,
  DASHBOARD_CHART_CARD_CLASS,
  DASHBOARD_CHART_SUBTITLE_CLASS,
  DASHBOARD_CHART_TITLE_CLASS,
} from "./constants";
import type { DashboardChartsProps } from "./types";
import { buildDashboardChartsData } from "./utils";

export function DashboardCharts({ isAdminView, personalMetrics, orgMetrics }: DashboardChartsProps) {
  const data = buildDashboardChartsData(isAdminView, personalMetrics, orgMetrics);

  if (!data) {
    return (
      <div className={DASHBOARD_CHART_CARD_CLASS}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign in to see charts.</p>
      </div>
    );
  }

  const { trendPoints, trendTitle, distributionItems, distributionTitle } = data;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={DASHBOARD_CHART_CARD_CLASS}>
        <h3 className={DASHBOARD_CHART_TITLE_CLASS}>{trendTitle}</h3>
        <p className={DASHBOARD_CHART_SUBTITLE_CLASS}>
          {isAdminView ? "Org-wide commercial shipment intake" : "Lines added to your scope"}
        </p>
        <div className="mt-4 h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendPoints} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_PRIMARY_ORANGE} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_PRIMARY_ORANGE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: CHART_AXIS_TICK, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: CHART_AXIS_TICK, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(9, 9, 11, 0.92)",
                  border: "1px solid rgba(63, 63, 70, 0.8)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#fafafa" }}
                itemStyle={{ color: CHART_PRIMARY_ORANGE }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Count"
                stroke={CHART_PRIMARY_ORANGE}
                strokeWidth={2}
                fill="url(#dashboardTrendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={DASHBOARD_CHART_CARD_CLASS}>
        <h3 className={DASHBOARD_CHART_TITLE_CLASS}>{distributionTitle}</h3>
        <p className={DASHBOARD_CHART_SUBTITLE_CLASS}>
          {isAdminView ? "Shipments by document workflow stage" : "Your lines by sync state"}
        </p>
        {distributionItems.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No data yet.</p>
        ) : (
          <div className="mt-4 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionItems} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: CHART_AXIS_TICK, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: CHART_AXIS_TICK, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(9, 9, 11, 0.92)",
                    border: "1px solid rgba(63, 63, 70, 0.8)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#fafafa" }}
                  cursor={{ fill: "rgba(255, 78, 0, 0.08)" }}
                />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {distributionItems.map((item, index) => (
                    <Cell
                      key={item.key}
                      fill={CHART_BAR_COLORS[index % CHART_BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
