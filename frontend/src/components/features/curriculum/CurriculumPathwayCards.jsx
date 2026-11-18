"use client";

import { useState } from "react";
import { spellNumberCapitalised } from "@/lib/numberWords";
import CobaltSectionHead from "@/components/features/home/CobaltSectionHead";
import CobaltPathwayCard from "@/components/features/pathways/CobaltPathwayCard";
import SignInToSelectModal from "@/components/features/pathways/SignInToSelectModal";
import { ROUTES } from "@/constants/routes";

// "Nine pathways through it." — the design's card grid under the tier ladder.
// The count in the heading and every figure on a card come from the API, so
// this cannot drift from the catalog the way the design's fixed copy would.
export default function CurriculumPathwayCards({ pathways = [] }) {
  // The pathway whose withheld bundle price a guest tapped. Kept after the
  // modal closes so its name doesn't vanish mid fade-out, matching how the
  // audience pages and the pathway store handle the same prompt.
  const [pricePrompt, setPricePrompt] = useState(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  if (pathways.length === 0) return null;

  return (
    <section id="curriculum-pathway-cards" className="cn-section">
      <div className="cn-container">
        <CobaltSectionHead
          headingId="curriculum-pathway-cards-heading"
          heading={`${spellNumberCapitalised(pathways.length)} pathways through it.`}
          lead="A pathway bundles the courses for one kind of learner. Prices show at checkout."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pathways.map((pathway, index) => (
            <CobaltPathwayCard
              key={pathway.id}
              pathway={pathway}
              revealDelay={index % 3}
              onRequestSignIn={(selected) => {
                setPricePrompt(selected);
                setIsSignInOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      <SignInToSelectModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        pathwayName={pricePrompt?.name}
        nextPath={ROUTES.CURRICULUM}
        intent="price"
        closeLabel="Keep Browsing"
      />
    </section>
  );
}
