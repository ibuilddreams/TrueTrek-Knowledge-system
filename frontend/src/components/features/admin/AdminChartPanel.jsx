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

const CHART_COLORS = ["#092d29", "#21483f", "#c7a85b", "#4a6b61", "#8fa89e"];

export default function AdminChartPanel({ title, data, dataKey, subtitle }) {
  const chartData = data || [];
  const total = chartData.reduce((sum, row) => sum + (Number(row.count) || 0), 0);

  return (
    <div className="bg-paper border border-line rounded-card shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col min-h-[300px]">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-line">
        <div>
          <h3 className="text-sm font-sans font-medium uppercase tracking-widest text-ink">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted font-light mt-1">{subtitle}</p>
          )}
        </div>
        <span className="shrink-0 text-xs font-sans font-medium uppercase tracking-widest px-2.5 py-1 rounded-lg bg-gold/12 text-gold border border-gold/20">
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,33,29,.12)" vertical={false} />
              <XAxis
                dataKey={dataKey}
                tick={{ fontSize: 13, fill: "#62706a" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 13, fill: "#62706a" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(9, 45, 41, 0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "rgba(22,33,29,.12)",
                  fontSize: 14,
                  boxShadow: "0 8px 24px rgba(16, 22, 21, 0.08)",
                }}
                labelStyle={{ color: "#101615", fontWeight: 600 }}
                itemStyle={{ color: "#092d29" }}
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
