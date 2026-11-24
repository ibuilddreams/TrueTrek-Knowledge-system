"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Gift, Plus, RefreshCw } from "lucide-react";
import { getMyPointsTransactions } from "@/services/pointsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatActivityType, formatDateTime } from "@/lib/adminFormatters";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import {
  PortalButton,
  PortalEmpty,
  PortalTable,
  PortalTd,
  PortalTh,
  PortalTr,
} from "./shell/PortalUI";

const PAGE_SIZE = 10;

// The points ledger, as the design's `SP.rewards` "Points history" tab draws
// it: every movement with the activity that caused it, what it was worth and
// what the balance stood at afterwards. Rendered bare — `RewardsTab` owns the
// card this sits in.
export default function PointsTransactionsTable() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["points", "transactions", page],
    queryFn: async () => {
      const response = await getMyPointsTransactions({ page, pageSize: PAGE_SIZE });
      return response?.data || { count: 0, results: [] };
    },
  });

  const transactions = data?.results || [];
  const count = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  if (isLoading) {
    return (
      <div className="p-10">
        <Loader fullScreen={false} tone="cobalt" label="Loading your points history..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
          <AlertCircle className="h-5 w-5" />
        </span>
        <p className="text-sm text-cn-p-ink-2">
          {getApiErrorMessage(error, "Unable to load transaction history.")}
        </p>
        <PortalButton size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </PortalButton>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <PortalEmpty
        icon={Plus}
        title="No points activity yet"
        text="Finish a drill, a quest or a course and the points land here."
      />
    );
  }

  return (
    <>
      <PortalTable>
        <thead>
          <tr>
            <PortalTh>Activity</PortalTh>
            <PortalTh>Date</PortalTh>
            <PortalTh align="right">Amount</PortalTh>
            <PortalTh align="right">Balance</PortalTh>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const isCredit = transaction.amount >= 0;
            return (
              <PortalTr key={transaction.id}>
                <PortalTd>
                  <span className="flex items-center gap-3">
                    <span
                      className={`grid h-9 w-9 flex-none place-items-center rounded-cn-p-sm ${
                        isCredit
                          ? "bg-cn-p-ok-bg text-cn-p-ok"
                          : "bg-cn-p-warn-bg text-cn-p-warn"
                      }`}
                    >
                      {isCredit ? (
                        <Plus className="h-4 w-4" />
                      ) : (
                        <Gift className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <b className="block font-semibold text-cn-p-ink">
                        {transaction.reason ||
                          formatActivityType(transaction.transaction_type)}
                      </b>
                      <span className="block text-[13px] text-cn-p-muted">
                        {transaction.redemption_reward_name ||
                          formatActivityType(transaction.transaction_type)}
                      </span>
                    </span>
                  </span>
                </PortalTd>
                <PortalTd className="text-sm whitespace-nowrap text-cn-p-ink-2">
                  {formatDateTime(transaction.created_at)}
                </PortalTd>
                <PortalTd align="right" numeric>
                  <b className={isCredit ? "font-bold text-cn-p-ok" : "font-bold text-cn-p-ink-2"}>
                    {isCredit ? "+" : ""}
                    {transaction.amount.toLocaleString()}
                  </b>
                </PortalTd>
                <PortalTd align="right" numeric className="text-sm text-cn-p-ink-2">
                  {transaction.balance_after.toLocaleString()}
                </PortalTd>
              </PortalTr>
            );
          })}
        </tbody>
      </PortalTable>

      <div className="px-5 pb-4">
        <Pagination
          size="lg"
          tone="cobalt"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${count} transaction${count === 1 ? "" : "s"}`}
        />
      </div>
    </>
  );
}
