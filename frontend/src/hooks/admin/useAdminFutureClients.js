"use client";

import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFutureClientApplications } from "@/services/futureClientsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  futureClientsFetchFailed,
  futureClientsFetchStart,
  futureClientsFetchSucceeded,
  selectFutureClients,
} from "@/store/slices/futureClients/futureClientsSlice";

export function useAdminFutureClients() {
  const dispatch = useDispatch();
  const futureClients = useSelector(selectFutureClients);
  const statusRef = useRef(futureClients.status);
  statusRef.current = futureClients.status;

  const loadFutureClients = useCallback(
    async ({ force = false } = {}) => {
      if (!force && statusRef.current !== "idle") {
        return;
      }

      dispatch(futureClientsFetchStart());
      try {
        const response = await getFutureClientApplications();
        const data = response?.data || {};
        dispatch(
          futureClientsFetchSucceeded({
            items: data.results || [],
            count: data.count || 0,
            queryKey: "all",
          })
        );
      } catch (error) {
        dispatch(
          futureClientsFetchFailed(getApiErrorMessage(error, "Unable to load applications."))
        );
      }
    },
    [dispatch]
  );

  return { ...futureClients, loadFutureClients };
}
