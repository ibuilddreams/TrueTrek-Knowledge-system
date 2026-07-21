"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import {
  selectPortal,
  setAggregateScore,
  setDrillCompletedList,
  setStreakDays,
} from "@/store/slices/portal/portalSlice";
import { resolveUpdater } from "@/utils";

/**
 * Student portal shared progress + auth-aware login flag.
 */
export function usePortalSession() {
  const dispatch = useDispatch();
  const portal = useSelector(selectPortal);
  const { isAuthenticated, role, loginStudent, logout } = useAuth();

  const isLoggedIn =
    isAuthenticated &&
    (role === AUTH_ROLES.STUDENT || role === AUTH_ROLES.FACULTY);

  const setIsLoggedIn = useCallback(
    async (value) => {
      if (value) {
        await loginStudent({
          email: "aiguy503@gmail.com",
          password: "simulated",
          name: "Marcus Vance Jr.",
        });
      } else {
        await logout();
      }
    },
    [loginStudent, logout]
  );

  const updateDrillCompletedList = useCallback(
    (value) => {
      dispatch(
        setDrillCompletedList(resolveUpdater(value, portal.drillCompletedList))
      );
    },
    [dispatch, portal.drillCompletedList]
  );

  const updateStreakDays = useCallback(
    (value) => {
      dispatch(setStreakDays(resolveUpdater(value, portal.streakDays)));
    },
    [dispatch, portal.streakDays]
  );

  const updateAggregateScore = useCallback(
    (value) => {
      dispatch(setAggregateScore(resolveUpdater(value, portal.aggregateScore)));
    },
    [dispatch, portal.aggregateScore]
  );

  return {
    isLoggedIn,
    drillCompletedList: portal.drillCompletedList,
    streakDays: portal.streakDays,
    aggregateScore: portal.aggregateScore,
    setIsLoggedIn,
    setDrillCompletedList: updateDrillCompletedList,
    setStreakDays: updateStreakDays,
    setAggregateScore: updateAggregateScore,
  };
}
