"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, Gift, History, TrendingDown, TrendingUp } from "lucide-react";
import { getMyPointsSummary } from "@/services/pointsService";
import StatCard from "@/components/ui/StatCard";
import TabNav from "@/components/ui/TabNav";
import RewardCatalogGrid from "../RewardCatalogGrid";
import PointsTransactionsTable from "../PointsTransactionsTable";
import RedemptionHistoryTable from "../RedemptionHistoryTable";

const SECTIONS = [
  { id: "catalog", label: "Rewards Catalog", icon: Gift },
  { id: "transactions", label: "Points History", icon: History },
  { id: "redemptions", label: "My Redemptions", icon: TrendingDown },
];

export default function RewardsTab() {
  const [activeSection, setActiveSection] = useState("catalog");

  const { data: summary } = useQuery({
    queryKey: ["points", "summary"],
    queryFn: async () => {
      const response = await getMyPointsSummary();
      return response?.data || { balance: 0, total_earned: 0, total_spent: 0 };
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          size="lg"
          label="Points Balance"
          value={(summary?.balance ?? 0).toLocaleString()}
          icon={Coins}
          accent="amber"
          hint="Available to spend in the rewards catalog"
        />
        <StatCard
          size="lg"
          label="Total Earned"
          value={(summary?.total_earned ?? 0).toLocaleString()}
          icon={TrendingUp}
          accent="emerald"
        />
        <StatCard
          size="lg"
          label="Total Spent"
          value={(summary?.total_spent ?? 0).toLocaleString()}
          icon={TrendingDown}
          accent="rose"
        />
      </div>

      <TabNav
        tabs={SECTIONS}
        activeTab={activeSection}
        onChange={setActiveSection}
        ariaLabel="Rewards sections"
        size="lg"
      />

      {activeSection === "catalog" && <RewardCatalogGrid />}
      {activeSection === "transactions" && <PointsTransactionsTable />}
      {activeSection === "redemptions" && <RedemptionHistoryTable />}
    </div>
  );
}
