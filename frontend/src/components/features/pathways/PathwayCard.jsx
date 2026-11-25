"use client";

import Link from "next/link";
import styles from "./PathwayCard.module.css";
import {
  CheckCircle2,
  ArrowUpRight,
  Plus,
  GraduationCap,
  Layers,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { pathwayAccentStyle } from "@/lib/pathwayAccents";
import PathwayPriceTag from "./PathwayPriceTag";

function getTierLabel(tiers) {
  if (!tiers || tiers.length === 0) return "Standalone";
  if (tiers.length === 1) return `Tier ${tiers[0].level}`;
  return `${tiers.length} Tiers`;
}

function getFocusLabel(tiers) {
  if (!tiers || tiers.length === 0) return "Standalone pathway";
  return tiers.map((tier) => tier.name).join(" · ");
}

export default function PathwayCard({
  pathway,
  isSelected,
  isOwned = false,
  canSelect = true,
  accentIndex = 0,
  onToggleSelect,
  onRequestSignIn,
  // "porcelain" (the default, unchanged) for the audience pages' card,
  // "cobalt" for the /pathways store. The variant lives entirely in
  // PathwayCard.module.css — see the `.cobalt` block there.
  tone = "porcelain",
  // Cobalt only: this card's place in the scroll-reveal stagger.
  revealDelay = null,
}) {
  const courseCount = pathway.course_count ?? 0;
  const isCobalt = tone === "cobalt";

  return (
    <div
      id={`pathway-card-${pathway.id}`}
      style={{
        ...pathwayAccentStyle(accentIndex, tone),
        ...(revealDelay !== null ? { "--cn-d": revealDelay } : {}),
      }}
      {...(isCobalt && revealDelay !== null ? { "data-cn-reveal": true } : {})}
      className={`${styles.card} ${isCobalt ? styles.cobalt : ""} ${
        isCobalt && revealDelay !== null ? "cn-reveal" : ""
      } ${isOwned ? styles.owned : isSelected ? styles.selected : ""}`}
    >
      <span aria-hidden="true" className={styles.accent} />

      {(isOwned || isSelected) && (
        <div className={styles.badgeSlot}>
          {isOwned ? (
            <span className={`${styles.badge} ${styles.badgeOwned}`}>
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              OWNED
            </span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeSelected}`}>
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              SELECTED
            </span>
          )}
        </div>
      )}

      <div className={styles.body}>
        <span className={styles.iconWrap}>
          <span aria-hidden="true" className={styles.halo} />
          <span className={styles.icon}>
            <Layers aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
          </span>
        </span>

        <span className={styles.eyebrow}>
          {courseCount} course{courseCount === 1 ? "" : "s"} included
        </span>

        <h3 className={styles.title}>
          {pathway.name}
        </h3>

        <p className={styles.focus}>
          {pathway.tiers?.length
            ? `${getTierLabel(pathway.tiers)} · ${getFocusLabel(pathway.tiers)}`
            : "Standalone pathway"}
        </p>

        <p className={styles.summary}>
          {pathway.summary || "No summary has been added for this pathway yet."}
        </p>
      </div>

      <div className={styles.footer}>
        <PathwayPriceTag
          price={pathway.base_price}
          onRequestSignIn={() => onRequestSignIn?.(pathway)}
        />

        {/* Above the stretched link, so the action is not a navigation. */}
        <div className="relative z-10">
          {isOwned ? (
            <span
              id={`pathway-owned-${pathway.id}`}
              className={`${styles.action} ${styles.status}`}
              title="You already have access to this pathway"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Already purchased
            </span>
          ) : canSelect ? (
            <button
              id={`pathway-toggle-select-${pathway.id}`}
              type="button"
              onClick={() => onToggleSelect(pathway)}
              aria-pressed={Boolean(isSelected)}
              aria-label={`${isSelected ? "Deselect" : "Select"} ${pathway.name}`}
              className={`${styles.action} ${isSelected ? styles.actionSelected : ""}`}
            >
              {isSelected ? "Selected" : "Select pathway"}
              {isSelected ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
            </button>
          ) : (
            <span
              className={`${styles.action} ${styles.status}`}
              title="Only student accounts can purchase pathways"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student only
            </span>
          )}
        </div>

        <span aria-hidden="true" className={styles.detail}>
          View details
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Stretched link: the whole card opens the pathway page. Rendered last
          so it paints over the card body, while the action above opts out
          with z-10. Keeps the markup free of nested interactive elements. */}
      <Link
        id={`pathway-view-details-${pathway.id}`}
        href={`${ROUTES.PATHWAYS}/${pathway.slug}`}
        aria-label={`View ${pathway.name} details`}
        className={styles.link}
      />
    </div>
  );
}
