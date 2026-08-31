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

const CHART_COLORS = ["#d97706", "#b45309", "#92400e", "#78350f", "#57534e"];

export default function AdminChartPanel({ title, data, dataKey, subtitle }) {
  const chartData = data || [];
  const total = chartData.reduce((sum, row) => sum + (Number(row.count) || 0), 0);

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-stone-100">
        <div>
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-stone-700">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-stone-400 font-light mt-1">{subtitle}</p>
          )}
        </div>
        <span className="shrink-0 text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
          {total} total
        </span>
      </div>

      <div className="flex-1 px-3 pb-4 pt-2">
        {chartData.length === 0 ? (
          <EmptyState size="lg"
            icon={BarChart3}
            label="No data available"
            description="Metrics will appear here once records exist."
            compact
          />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis
                dataKey={dataKey}
                tick={{ fontSize: 13, fill: "#78716c" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 13, fill: "#78716c" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(217, 119, 6, 0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#e7e5e4",
                  fontSize: 14,
                  boxShadow: "0 8px 24px rgba(28, 25, 23, 0.08)",
                }}
                labelStyle={{ color: "#292524", fontWeight: 600 }}
                itemStyle={{ color: "#78350f" }}
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
