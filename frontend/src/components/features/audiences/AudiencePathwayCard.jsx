"use client";

import Link from "next/link";
import styles from "../pathways/PathwayCard.module.css";
import { ArrowUpRight, Clock, Layers } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";

// A browse-only pathway card for the audience pages. Deliberately not
// PathwayCard: that one carries the select/checkout flow of the /pathways
// store, which needs selection state, ownership lookups and a checkout modal.
// Audience pages are navigation — they hand the visitor off to the pathway
// page, where buying already works.
export default function AudiencePathwayCard({ pathway }) {
  const courseCount = pathway.course_count ?? 0;

  return (
    <div
      id={`audience-pathway-card-${pathway.id}`}
      className={styles.card}
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

        {pathway.duration_weeks > 0 && (
          <span className="flex items-center gap-1.5 font-sans text-xs text-muted">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            {pathway.duration_weeks} week{pathway.duration_weeks === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>
          {pathway.name}
        </h3>
        <p className={styles.summary}>
          {pathway.summary || "No summary has been added for this pathway yet."}
        </p>

      </div>

      <div className={styles.footer}>
        <div className={styles.priceRow}>
          <div>
            <span className={styles.priceLabel}>Bundle price</span>
            <span className={styles.price}>{formatCoursePrice(pathway.base_price)}</span>
          </div>
          <Layers aria-hidden="true" className="h-5 w-5 text-moss/40" strokeWidth={1.5} />
        </div>
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
