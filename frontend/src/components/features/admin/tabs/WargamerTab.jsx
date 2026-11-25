"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gauge, ListChecks, ShieldCheck, Theater, TriangleAlert } from "lucide-react";
import { getAdminRolePlayStats } from "@/services/wargamerService";
import StatCard from "@/components/ui/StatCard";
import TabNav from "@/components/ui/TabNav";
import AdminRolePlayScenariosSection from "@/components/features/admin/AdminRolePlayScenariosSection";
import AdminRolePlaySessionsSection from "@/components/features/admin/AdminRolePlaySessionsSection";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";

const SECTIONS = [
  { id: "scenarios", label: "Scenarios", icon: Theater },
  { id: "sessions", label: "Student runs", icon: ListChecks },
];

/**
 * Admin surface for LS-302, the AI role-play module.
 *
 * Mirrors the Daily Quests tab: a catalog an admin authors, and a read-only
 * feed of what students actually did with it.
 */
export default function WargamerTab() {
  const [activeSection, setActiveSection] = useState("scenarios");
  // Set when an admin picks "View Runs" on a catalog row, so the feed opens
  // already scoped to that scenario.
  const [scenarioFilter, setScenarioFilter] = useState(null);

  const { data: stats } = useQuery({
    queryKey: ["admin-roleplay", "stats"],
    queryFn: async () => {
      const response = await getAdminRolePlayStats();
      return response?.data || null;
    },
  });

  const handleViewSessions = (scenario) => {
    setScenarioFilter(scenario);
    setActiveSection("sessions");
  };

  const handleSectionChange = (section) => {
    // Leaving the feed by hand drops the per-scenario scope, so coming back
    // later doesn't silently show a filtered table.
    if (section !== "sessions") setScenarioFilter(null);
    setActiveSection(section);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Tactical wargamer"
        subtitle="The role-play scenarios students practise against, and every run they have made."
      />

      <div className="relative bg-cn-p-card border border-cn-p-line rounded-cn-p p-6 overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-cn-p-soft border border-cn-p-soft text-cn-p-soft-ink flex items-center justify-center shrink-0">
            <Theater className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-cn-p-ink">
              LS-302 Tactical Wargamer &mdash; The &ldquo;No&rdquo; Muscle
            </h3>
            <p className="text-xs text-cn-p-ink-2 font-light mt-1 leading-relaxed max-w-3xl">
              Students practise declining money, access and time requests against an AI playing
              the person applying the pressure, then get scored on Time to Boundary, Tone Control
              and Deflection to Policy. Runs are scored automatically and pay out immediately, so
              there is nothing to approve here &mdash; use Student Runs to see how it is landing.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard tone="cobalt"
          size="lg"
          label="Published scenarios"
          value={stats?.published_scenarios ?? 0}
          icon={Theater}
          accent="emerald"
          hint={`${stats?.draft_scenarios ?? 0} draft · ${stats?.archived_scenarios ?? 0} archived`}
        />
        <StatCard tone="cobalt"
          size="lg"
          label="Pass rate"
          value={`${stats?.pass_rate ?? 0}%`}
          icon={ShieldCheck}
          accent="stone"
          hint={`${(stats?.sessions_passed ?? 0).toLocaleString()} of ${(stats?.sessions_completed ?? 0).toLocaleString()} scored runs`}
        />
        <StatCard tone="cobalt"
          size="lg"
          label="Average score"
          value={stats?.average_overall_score ?? 0}
          icon={Gauge}
          accent="amber"
          hint={`Boundary ${stats?.average_time_to_boundary ?? 0} · Tone ${stats?.average_tone_control ?? 0} · Policy ${stats?.average_deflection_to_policy ?? 0}`}
        />
        <StatCard tone="cobalt"
          size="lg"
          label="Made-up excuses"
          value={`${stats?.fabricated_excuse_rate ?? 0}%`}
          icon={TriangleAlert}
          accent="rose"
          hint="Runs where the boundary leaned on an authority the athlete doesn't have"
        />
      </div>

      <TabNav tone="cobalt"
        tabs={SECTIONS}
        activeTab={activeSection}
        onChange={handleSectionChange}
        ariaLabel="Tactical Wargamer sections"
        size="lg"
      />

      {activeSection === "scenarios" && (
        <AdminRolePlayScenariosSection onViewSessions={handleViewSessions} />
      )}
      {activeSection === "sessions" && (
        <AdminRolePlaySessionsSection
          scenarioFilter={scenarioFilter}
          onClearScenarioFilter={() => setScenarioFilter(null)}
        />
      )}
    </div>
  );
}
