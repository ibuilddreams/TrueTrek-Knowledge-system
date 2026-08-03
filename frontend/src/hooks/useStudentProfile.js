"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/services/profileService";

export function useStudentProfile(enabled = true) {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!enabled) {
      setProfile(null);
      setStatus("idle");
      return undefined;
    }

    let isMounted = true;
    setStatus("loading");

    (async () => {
      try {
        const response = await getProfile();
        if (!isMounted) return;
        setProfile(response?.data || null);
        setStatus("succeeded");
      } catch {
        if (!isMounted) return;
        setProfile(null);
        setStatus("failed");
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  return {
    profile,
    status,
    displayName: profile?.full_name?.trim() || "Student",
  };
}
