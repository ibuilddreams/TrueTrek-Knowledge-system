"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { consumeSignInCelebration } from "@/lib/signInCelebration";

// Fires the welcome burst on the first portal screen a visitor sees after
// signing in. Called from `PortalShell`, so it covers the student, teacher and
// admin portals alike rather than only the screen one role happens to land on.
//
// `confetti` is imported statically on purpose. Loading it on demand would
// make the effect asynchronous, and under React's development double-mount the
// first pass consumes the flag while its cleanup cancels the pending import —
// so nothing would ever fire in development. Consuming and throwing in the
// same synchronous pass makes the whole thing idempotent instead.
export function useSignInCelebration() {
  useEffect(() => {
    if (!consumeSignInCelebration()) return;
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#2450e6", "#879ff1", "#0f2580"],
    });
  }, []);
}
