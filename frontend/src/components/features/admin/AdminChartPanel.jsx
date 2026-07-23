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
import EmptyState from "@/components/ui/EmptyState";

const CHART_COLORS = ["#d97706", "#b45309", "#92400e", "#78350f", "#57534e"];

export default function AdminChartPanel({ title, data, dataKey }) {
  const chartData = data || [];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-700 mb-4">{title}</h3>
      {chartData.length === 0 ? (
        <EmptyState label="No data available." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey={dataKey} tick={{ fontSize: 11, fill: "#78716c" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#78716c" }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, borderColor: "#e7e5e4", fontSize: 12 }}
              labelStyle={{ color: "#292524", fontWeight: 600 }}
              itemStyle={{ color: "#78350f" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={entry[dataKey] || index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
