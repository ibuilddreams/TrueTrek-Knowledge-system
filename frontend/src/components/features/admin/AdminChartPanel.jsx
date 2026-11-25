"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_SERIES,
  CHART_TOOLTIP,
} from "@/lib/chartTheme";

// The palette lives in lib/chartTheme so the three dashboards cannot drift.
const CHART_COLORS = CHART_SERIES;

export default function AdminChartPanel({ title, data, dataKey, subtitle }) {
  const chartData = data || [];
  const total = chartData.reduce((sum, row) => sum + (Number(row.count) || 0), 0);

  return (
    <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col min-h-[300px]">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-cn-p-line">
        <div>
          <h3 className="text-sm font-sans font-medium text-cn-p-ink">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-cn-p-ink-2 font-light mt-1">{subtitle}</p>
          )}
        </div>
        <span className="shrink-0 text-xs font-sans font-medium px-2.5 py-1 rounded-lg bg-cn-p-soft text-cn-p-soft-ink border border-cn-p-soft">
          {total} total
        </span>
      </div>

      <div className="flex-1 px-3 pb-4 pt-2">
        {chartData.length === 0 ? (
          <EmptyState tone="portal" size="lg"
            icon={BarChart3}
            label="No data available"
            description="Metrics will appear here once records exist."
            compact
          />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
              <XAxis
                dataKey={dataKey}
                tick={{ fontSize: 13, fill: CHART_AXIS }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 13, fill: CHART_AXIS }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(36, 80, 230, 0.06)" }}
                {...CHART_TOOLTIP}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry[dataKey] || index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
