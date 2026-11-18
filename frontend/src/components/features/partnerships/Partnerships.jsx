"use client";

import { useMemo, useRef, useState } from "react";
import useScrollReveal from "@/hooks/useScrollReveal";
import {
  DEFAULT_COUNSELOR_RATIO,
  DEFAULT_LEVEL_ID,
  DEFAULT_SEATS,
  LICENCE_LEVELS,
} from "@/data/schoolLicensing";
import SchoolsHero from "./SchoolsHero";
import SchoolsLicence from "./SchoolsLicence";
import SchoolsTimeline from "./SchoolsTimeline";
import SchoolsCompare from "./SchoolsCompare";
import SchoolsEstimator from "./SchoolsEstimator";
import SchoolsFaq from "./SchoolsFaq";
import SchoolsBriefing from "./SchoolsBriefing";

// The For schools page: what a licence includes, how a rollout runs, what the
// levels cost, an estimator, the licensing questions, and the briefing form.
//
// The estimator's state lives here rather than inside it, because three
// sections share one answer: the comparison table sets the level ("Estimate
// Platinum"), the estimator shows the figure, and the briefing form carries it
// into the message so a reply can start from the same numbers.
export default function Partnerships() {
  const pageRef = useRef(null);
  const estimatorRef = useRef(null);
  const briefingRef = useRef(null);

  const [seats, setSeats] = useState(DEFAULT_SEATS);
  const [levelId, setLevelId] = useState(DEFAULT_LEVEL_ID);
  const [ratio, setRatio] = useState(DEFAULT_COUNSELOR_RATIO);

  const { fee, counselors } = useMemo(() => {
    const level = LICENCE_LEVELS.find((item) => item.id === levelId);
    return {
      fee: seats * (level?.rate || 0),
      // Rounded up: a part-time counselor is still a counselor, and rounding
      // down would understate what the school has to staff.
      counselors: Math.max(1, Math.ceil(seats / ratio)),
    };
  }, [seats, levelId, ratio]);

  useScrollReveal(pageRef, []);

  function scrollTo(ref) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleEstimateLevel(nextLevelId) {
    setLevelId(nextLevelId);
    scrollTo(estimatorRef);
  }

  return (
    <div
      id="partnerships-container"
      ref={pageRef}
      className="min-h-screen bg-cn-paper text-cn-ink"
    >
      <SchoolsHero
        onRequestBriefing={() => scrollTo(briefingRef)}
        onJumpToEstimator={() => scrollTo(estimatorRef)}
      />
      <SchoolsLicence />
      <SchoolsTimeline />
      <SchoolsCompare onEstimate={handleEstimateLevel} />
      <SchoolsEstimator
        sectionRef={estimatorRef}
        seats={seats}
        onSeatsChange={setSeats}
        levelId={levelId}
        onLevelChange={setLevelId}
        ratio={ratio}
        onRatioChange={setRatio}
        fee={fee}
        counselors={counselors}
        onRequestBriefing={() => scrollTo(briefingRef)}
      />
      <SchoolsFaq />
      <SchoolsBriefing
        sectionRef={briefingRef}
        estimate={{ seats, levelId, fee }}
      />
    </div>
  );
}
