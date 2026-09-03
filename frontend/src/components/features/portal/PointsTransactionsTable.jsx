"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyPointsTransactions } from "@/services/pointsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatActivityType, formatDateTime } from "@/lib/adminFormatters";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

function AmountCell({ amount }) {
  const isPositive = amount >= 0;
  return (
    <span className={`font-mono font-bold ${isPositive ? "text-emerald-700" : "text-rose-600"}`}>
      {isPositive ? "+" : ""}
      {amount.toLocaleString()}
    </span>
  );
}

function ReasonCell({ transaction }) {
  return (
    <div>
      <p className="text-stone-700">{transaction.reason || formatActivityType(transaction.transaction_type)}</p>
      {transaction.redemption_reward_name && (
        <p className="text-[11px] text-stone-400 font-light">{transaction.redemption_reward_name}</p>
      )}
    </div>
  );
}

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
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  const columns = [
    {
      key: "created_at",
      header: "Date",
      render: (transaction) => (
        <span className="text-stone-500 whitespace-nowrap">{formatDateTime(transaction.created_at)}</span>
      ),
    },
    {
      key: "reason",
      header: "Activity",
      render: (transaction) => <ReasonCell transaction={transaction} />,
    },
    {
      key: "type",
      header: "Type",
      render: (transaction) => (
        <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
          {formatActivityType(transaction.transaction_type)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (transaction) => <AmountCell amount={transaction.amount} />,
    },
    {
      key: "balance_after",
      header: "Balance",
      render: (transaction) => (
        <span className="font-mono text-stone-500">{transaction.balance_after.toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
      <DataTable
        size="lg"
        columns={columns}
        rows={transactions}
        isLoading={isLoading}
        error={isError ? getApiErrorMessage(error, "Unable to load transaction history.") : null}
        onRetry={refetch}
        emptyLabel="No points activity yet."
      />
      <Pagination
        size="lg"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalLabel={`${data?.count || 0} transaction${(data?.count || 0) === 1 ? "" : "s"}`}
      />
    </div>
  );
}
