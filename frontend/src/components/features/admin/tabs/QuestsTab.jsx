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

const SECTIONS = [
  { id: "catalog", label: "Quest Catalog", icon: Swords },
  { id: "submissions", label: "Student Submissions", icon: ListChecks },
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
    <div className="space-y-6">
      <QuestLifecyclePanel questsPerDay={stats?.quests_per_student_per_day} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          size="lg"
          label="Published Quests"
          value={stats?.published_quests ?? 0}
          icon={Swords}
          accent="emerald"
          hint={`${stats?.draft_quests ?? 0} draft · ${stats?.archived_quests ?? 0} archived`}
        />
        <StatCard
          size="lg"
          label="Rotation Runway"
          value={`${stats?.days_of_rotation ?? 0} days`}
          icon={CalendarRange}
          accent="amber"
          hint="Before a student starts seeing repeats — publish more to extend it"
        />
        <StatCard
          size="lg"
          label="Completion Rate"
          value={`${stats?.completion_rate ?? 0}%`}
          icon={CheckCircle2}
          accent="stone"
          hint={`${(stats?.total_completed ?? 0).toLocaleString()} of ${(stats?.total_assigned ?? 0).toLocaleString()} assigned`}
        />
        <StatCard
          size="lg"
          label="Points Paid Out"
          value={(stats?.points_awarded ?? 0).toLocaleString()}
          icon={Coins}
          accent="rose"
          hint={`${stats?.completed_today ?? 0} of ${stats?.assigned_today ?? 0} done today`}
        />
      </div>

      <TabNav
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
