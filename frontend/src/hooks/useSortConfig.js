"use client";

import { useCallback, useState } from "react";
import { toggleSortConfig } from "@/lib/sorting";

const DEFAULT_SORT = { key: null, direction: null };

// Local sort state for a DataTable list screen: [sortConfig, toggleSort].
// Pass sortConfig/onSortChange={toggleSort} straight through to <DataTable>,
// and use sortConfig with lib/sorting's sortRows() on the filtered list before
// pagination slices it.
export function useSortConfig(initial = DEFAULT_SORT) {
  const [sortConfig, setSortConfig] = useState(initial);

  const toggleSort = useCallback((key) => {
    setSortConfig((prev) => toggleSortConfig(prev, key));
  }, []);

  return [sortConfig, toggleSort];
}
