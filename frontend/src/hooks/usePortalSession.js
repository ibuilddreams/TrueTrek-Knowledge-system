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
  setPoints,
  setConsultationCount,
} from "@/store/slices/portal/portalSlice";
import { resolveUpdater } from "@/utils";

export function usePortalSession() {
  const dispatch = useDispatch();
  const portal = useSelector(selectPortal);
  const { isAuthenticated, role, logout } = useAuth();

  const isLoggedIn = isAuthenticated && role === AUTH_ROLES.STUDENT;

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

  const updatePoints = useCallback(
    (value) => {
      dispatch(setPoints(resolveUpdater(value, portal.points)));
    },
    [dispatch, portal.points]
  );

  const updateConsultationCount = useCallback(
    (value) => {
      dispatch(
        setConsultationCount(resolveUpdater(value, portal.consultationCount))
      );
    },
    [dispatch, portal.consultationCount]
  );

  return {
    isLoggedIn,
    logout,
    drillCompletedList: portal.drillCompletedList,
    streakDays: portal.streakDays,
    aggregateScore: portal.aggregateScore,
    points: portal.points,
    consultationCount: portal.consultationCount,
    setDrillCompletedList: updateDrillCompletedList,
    setStreakDays: updateStreakDays,
    setAggregateScore: updateAggregateScore,
    setPoints: updatePoints,
    setConsultationCount: updateConsultationCount,
  };
}
