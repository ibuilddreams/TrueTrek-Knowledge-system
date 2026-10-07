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
import { formatCoursePrice } from "@/lib/store";

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
  onToggleSelect,
}) {
  const courseCount = pathway.course_count ?? 0;

  return (
    <div
      id={`pathway-card-${pathway.id}`}
      className={`${styles.card} ${isOwned ? styles.owned : isSelected ? styles.selected : ""}`}
    >
      <div className={styles.header}>
        <div className={styles.courseInfo}>
          <span className={styles.icon}>
            <Layers aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <span className={styles.eyebrow}>Learning pathway</span>
            <span className={styles.count}>{courseCount} course{courseCount === 1 ? "" : "s"} included</span>
          </div>
        </div>

        {isOwned ? (
          <span className="flex items-center gap-1 text-[10px] font-sans font-medium uppercase tracking-widest border px-2.5 py-1 rounded-full shrink-0 bg-sage text-moss border-moss/30">
            <CheckCircle2 className="w-3 h-3 shrink-0 text-moss" />
            OWNED
          </span>
        ) : (
          isSelected && (
            <span className="flex items-center gap-1 text-[10px] font-sans font-medium uppercase tracking-widest border px-2.5 py-1 rounded-full shrink-0 bg-gold/15 text-[#8a6f2e] border-gold/30">
              <CheckCircle2 className="w-3 h-3 shrink-0 text-gold" />
              SELECTED
            </span>
          )
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>
          {pathway.name}
        </h3>
        <p className={styles.focus}>
          {pathway.tiers?.length ? `${getTierLabel(pathway.tiers)} · ${getFocusLabel(pathway.tiers)}` : "Standalone pathway"}
        </p>
        <p className={styles.summary}>
          {pathway.summary || "No summary has been added for this pathway yet."}
        </p>
      </div>

      <div className={styles.footer}>
        <div className={styles.priceRow}>
          <div>
            <span className={styles.priceLabel}>
              Bundle price
            </span>
            <span className={styles.price}>
              {formatCoursePrice(pathway.base_price)}
            </span>
          </div>

          <span
            aria-hidden="true"
            className={styles.detail}
          >
            View details
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Above the stretched link, so the action is not a navigation. */}
        <div className="relative z-10">
          {isOwned ? (
            <span
              id={`pathway-owned-${pathway.id}`}
              className={`${styles.action} ${styles.status}`}
              title="You already have access to this pathway"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Already Purchased
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
              Student Only
            </span>
          )}
        </div>
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
