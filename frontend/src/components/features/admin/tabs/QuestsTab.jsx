"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, CheckCircle2, Coins, ListChecks, Swords } from "lucide-react";
import { getAdminQuestStats } from "@/services/questsService";
import StatCard from "@/components/ui/StatCard";
import TabNav from "@/components/ui/TabNav";
import QuestLifecyclePanel from "@/components/features/admin/QuestLifecyclePanel";
import AdminQuestCatalogSection from "@/components/features/admin/AdminQuestCatalogSection";
import AdminQuestSubmissionsSection from "@/components/features/admin/AdminQuestSubmissionsSection";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";

const SECTIONS = [
  { id: "catalog", label: "Quest catalog", icon: Swords },
  { id: "submissions", label: "Student submissions", icon: ListChecks },
];

export default function QuestsTab() {
  const [activeSection, setActiveSection] = useState("catalog");
  // Set when an admin picks "View Submissions" on a catalog row, so the
  // submissions table opens already scoped to that quest.
  const [questFilter, setQuestFilter] = useState(null);

  const { data: stats } = useQuery({
    queryKey: ["admin-quests", "stats"],
    queryFn: async () => {
      const response = await getAdminQuestStats();
      return response?.data || null;
    },
  });

  const handleViewSubmissions = (quest) => {
    setQuestFilter(quest);
    setActiveSection("submissions");
  };

  const handleSectionChange = (section) => {
    // Leaving the submissions tab by hand drops the per-quest scope, so
    // coming back later doesn't silently show a filtered table.
    if (section !== "submissions") setQuestFilter(null);
    setActiveSection(section);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Daily quests"
        subtitle="You write the catalog. Three quests are dealt to each student daily; students self-report and points pay out instantly."
      />

      <QuestLifecyclePanel questsPerDay={stats?.quests_per_student_per_day} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard tone="cobalt"
          size="lg"
          label="Published quests"
          value={stats?.published_quests ?? 0}
          icon={Swords}
          accent="emerald"
          hint={`${stats?.draft_quests ?? 0} draft · ${stats?.archived_quests ?? 0} archived`}
        />
        <StatCard tone="cobalt"
          size="lg"
          label="Rotation runway"
          value={`${stats?.days_of_rotation ?? 0} days`}
          icon={CalendarRange}
          accent="amber"
          hint="Before a student starts seeing repeats — publish more to extend it"
        />
        <StatCard tone="cobalt"
          size="lg"
          label="Completion rate"
          value={`${stats?.completion_rate ?? 0}%`}
          icon={CheckCircle2}
          accent="stone"
          hint={`${(stats?.total_completed ?? 0).toLocaleString()} of ${(stats?.total_assigned ?? 0).toLocaleString()} assigned`}
        />
        <StatCard tone="cobalt"
          size="lg"
          label="Points paid out"
          value={(stats?.points_awarded ?? 0).toLocaleString()}
          icon={Coins}
          accent="rose"
          hint={`${stats?.completed_today ?? 0} of ${stats?.assigned_today ?? 0} done today`}
        />
      </div>

      <TabNav tone="cobalt"
        tabs={SECTIONS}
        activeTab={activeSection}
        onChange={handleSectionChange}
        ariaLabel="Daily Quests sections"
        size="lg"
      />

      {activeSection === "catalog" && (
        <AdminQuestCatalogSection onViewSubmissions={handleViewSubmissions} />
      )}
      {activeSection === "submissions" && (
        <AdminQuestSubmissionsSection
          questFilter={questFilter}
          onClearQuestFilter={() => setQuestFilter(null)}
        />
      )}
    </div>
  );
}
