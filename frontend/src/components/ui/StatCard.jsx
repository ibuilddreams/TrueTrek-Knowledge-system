"use client";

export default function StatCard({ label, value, icon: Icon, footer }) {
  return (
    <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-stone-400">{label}</p>
        <p className="text-3xl font-serif font-bold text-stone-900 mt-2">{value}</p>
        {footer}
      </div>
      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-750">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
