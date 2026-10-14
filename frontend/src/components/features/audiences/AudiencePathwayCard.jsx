"use client";

import Link from "next/link";
import styles from "../pathways/PathwayCard.module.css";
import { ArrowUpRight, Clock, Layers } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";
import { pathwayAccentStyle } from "@/lib/pathwayAccents";

// A browse-only pathway card for the audience pages. Deliberately not
// PathwayCard: that one carries the select/checkout flow of the /pathways
// store, which needs selection state, ownership lookups and a checkout modal.
// Audience pages are navigation — they hand the visitor off to the pathway
// page, where buying already works.
//
// It shares PathwayCard's stylesheet so both grids stay the same card.
export default function AudiencePathwayCard({ pathway, accentIndex = 0 }) {
  const courseCount = pathway.course_count ?? 0;

  return (
    <div
      id={`audience-pathway-card-${pathway.id}`}
      style={pathwayAccentStyle(accentIndex)}
      className={styles.card}
    >
      <span aria-hidden="true" className={styles.accent} />

      {pathway.duration_weeks > 0 && (
        <div className={styles.badgeSlot}>
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-porcelain px-2.5 py-1 font-sans text-[10px] font-medium uppercase tracking-widest text-muted">
            <Clock aria-hidden="true" className="h-3 w-3" />
            {pathway.duration_weeks} week{pathway.duration_weeks === 1 ? "" : "s"}
          </span>
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

        <p className={styles.summary}>
          {pathway.summary || "No summary has been added for this pathway yet."}
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.priceLabel}>Bundle price</span>
        <span className={styles.price}>{formatCoursePrice(pathway.base_price)}</span>

        <span aria-hidden="true" className={`${styles.action} ${styles.browseAction}`}>
          Explore pathway
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      {/* Stretched link: the whole card opens the pathway page. Rendered last
          so it paints over the card body — same approach as PathwayCard. */}
      <Link
        href={`${ROUTES.PATHWAYS}/${pathway.slug}`}
        aria-label={`View ${pathway.name} details`}
        className={styles.link}
      />
    </div>
  );
}
