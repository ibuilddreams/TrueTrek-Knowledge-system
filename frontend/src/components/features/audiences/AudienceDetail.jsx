"use client";

import { useState } from "react";
import styles from "./AudienceDetail.module.css";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  RefreshCw,
  Route,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { ROUTES } from "@/constants/routes";
import { getAudienceProfile } from "@/data/audiences";
import { getPublicCourses } from "@/services/coursesService";
import { getPublicPathways } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import StoreCourseCard from "@/components/features/store/StoreCourseCard";
import AudienceCardGridSkeleton from "./AudienceCardGridSkeleton";
import AudiencePathwayCard from "./AudiencePathwayCard";
import AudienceSectionHeader from "./AudienceSectionHeader";

const PATHWAY_PAGE_SIZE = 6;
const COURSE_PAGE_SIZE = 6;

function scrollToSection(event) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const hash = event.currentTarget.hash;
  const section = document.getElementById(hash.slice(1));
  if (!section) return;

  event.preventDefault();
  if (window.location.hash !== hash) {
    window.history.pushState(null, "", hash);
  }
  section.focus({ preventScroll: true });
  section.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });
}

// Full-width so it lines up with the grid it replaces, rather than sitting as
// a small island in the middle of an otherwise empty section.
function SectionError({ title, error, onRetry }) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-panel border border-clay/25 bg-rose/10 p-8 sm:flex-row sm:items-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-clay/25 bg-paper text-clay">
        <AlertCircle className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-xl font-light text-ink">{title}</h3>
        <p className="mt-1 text-xs font-light leading-relaxed text-muted">
          {getApiErrorMessage(error, "Something went wrong. Please try again.")}
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-paper px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-widest text-ink transition hover:bg-porcelain"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}

// Keep unknown counts distinct from zero and preserve dt/dd reading order.
function HeroStat({ value, label, isReady }) {
  return (
    <div className={styles.stat}>
      <dt className={styles.statLabel}>
        {label}
      </dt>
      <dd className={styles.statValue}>
        {isReady ? value : "—"}
      </dd>
    </div>
  );
}

// Takes a slug rather than the profile object: the route is a Server
// Component, and a profile carries its `icon` as a React component, which
// cannot cross the server/client boundary as a prop. The route has already
// rejected an unknown slug with notFound().
export default function AudienceDetail({ slug }) {
  const profile = getAudienceProfile(slug);
  const { isAuthenticated, isStudent } = useAuth();

  // Same gating as the store: guests and students get a cart, teachers and
  // admins browse without one.
  const canUseCart = !isAuthenticated || isStudent;
  const { isInCart, isPending: isCartActionPending, toggleCourse } = useCart();
  const wishlist = useWishlist();

  const audienceSlug = profile?.slug;
  const Icon = profile?.icon;

  const [pathwayPage, setPathwayPage] = useState(1);
  const [coursePage, setCoursePage] = useState(1);

  // Both lists are scoped server-side to this audience: pathways by their own
  // audience link, courses by the published pathways that carry them.
  const pathwaysQuery = useQuery({
    queryKey: ["audience-pathways", audienceSlug, pathwayPage],
    queryFn: async () => {
      const response = await getPublicPathways({
        page: pathwayPage,
        pageSize: PATHWAY_PAGE_SIZE,
        audience: audienceSlug,
      });
      return response?.data || { results: [], count: 0 };
    },
    enabled: Boolean(audienceSlug),
    placeholderData: keepPreviousData,
  });

  const coursesQuery = useQuery({
    queryKey: ["audience-courses", audienceSlug, coursePage],
    queryFn: async () => {
      const response = await getPublicCourses({
        page: coursePage,
        pageSize: COURSE_PAGE_SIZE,
        audience: audienceSlug,
      });
      return response?.data || { results: [], count: 0 };
    },
    enabled: Boolean(audienceSlug),
    placeholderData: keepPreviousData,
  });

  const pathways = pathwaysQuery.data?.results || [];
  const totalPathways = pathwaysQuery.data?.count || 0;
  const totalPathwayPages = Math.max(1, Math.ceil(totalPathways / PATHWAY_PAGE_SIZE));

  const courses = coursesQuery.data?.results || [];
  const totalCourses = coursesQuery.data?.count || 0;
  const totalCoursePages = Math.max(1, Math.ceil(totalCourses / COURSE_PAGE_SIZE));

  // Defensive only — the route resolves the slug before rendering this.
  if (!profile) return null;

  return (
    <div id={`audience-page-${profile.slug}`} className="min-h-screen cn-page-bg pb-24 text-ink">
      <header id="audience-banner-layout" className="mx-auto max-w-6xl px-6 pt-8 sm:pt-10">
        <Link href={ROUTES.HOME_AUDIENCES} className={styles.backLink}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          All audiences
        </Link>

        <div className={styles.hero}>
          <div className={styles.copy}>
            <div className={styles.eyebrow}>
              <span className={`${styles.icon} ${profile.iconClassName}`}>
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span>{profile.tag}</span>
            </div>
            <h1 className={styles.title}>{profile.title}</h1>
            <p className={styles.description}>{profile.description}</p>

            {profile.chips?.length > 0 && (
              <div className={styles.chips}>
                {profile.chips.map((chip) => (
                  <span key={chip} className={styles.chip}>{chip}</span>
                ))}
              </div>
            )}

            <div className={styles.actions}>
              <a href="#audience-pathways-section" onClick={scrollToSection} className={styles.primaryAction}>
                Explore pathways <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
              <a href="#audience-courses-section" onClick={scrollToSection} className={styles.secondaryAction}>
                Browse courses <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>

            <dl className={styles.stats} aria-label="Available learning options">
              <HeroStat value={totalPathways} label={`Pathway${totalPathways === 1 ? "" : "s"}`} isReady={pathwaysQuery.isSuccess} />
              <HeroStat value={totalCourses} label={`Course${totalCourses === 1 ? "" : "s"}`} isReady={coursesQuery.isSuccess} />
            </dl>
          </div>

          <div className={styles.artwork}>
            <img src={profile.image} alt="" className={styles.image} fetchPriority="high" />
          </div>
        </div>
      </header>

      {/* Pathways for this audience */}
      <section id="audience-pathways-section" tabIndex={-1} className="mx-auto max-w-6xl px-6 pt-14 scroll-mt-28">
        <AudienceSectionHeader
          eyebrow="Bundled Programs"
          heading="Find your pathway"
          description={`Explore course bundles for ${profile.title.toLowerCase()}, with a clear path from learning to putting your skills into practice.`}
          count={pathwaysQuery.isSuccess ? totalPathways : null}
          countLabel="pathway"
          action={
            <Link
              href={ROUTES.PATHWAYS}
              className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-widest text-moss transition-all hover:gap-2.5 hover:text-pine"
            >
              All Pathways
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {pathwaysQuery.isLoading && <AudienceCardGridSkeleton count={3} />}

        {pathwaysQuery.isError && (
          <SectionError
            title="Failed to Load Pathways"
            error={pathwaysQuery.error}
            onRetry={() => pathwaysQuery.refetch()}
          />
        )}

        {!pathwaysQuery.isLoading && !pathwaysQuery.isError && pathways.length === 0 && (
          <div className="rounded-panel border border-dashed border-line bg-paper/60 py-4">
            <EmptyState
              icon={Route}
              size="lg"
              label={`No pathways assigned to ${profile.title} yet`}
              description="This audience is still being mapped. Browse every published pathway in the meantime."
              action={
                <Link
                  href={ROUTES.PATHWAYS}
                  className="inline-flex items-center gap-1.5 rounded-full bg-pine px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-widest text-paper transition hover:bg-moss"
                >
                  Browse All Pathways
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
          </div>
        )}

        {!pathwaysQuery.isLoading && !pathwaysQuery.isError && pathways.length > 0 && (
          <>
            <motion.div
              id="audience-pathways-grid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`grid grid-cols-1 gap-8 transition-opacity duration-200 md:grid-cols-2 lg:grid-cols-3 ${
                pathwaysQuery.isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              {pathways.map((pathway) => (
                <AudiencePathwayCard
                  key={pathway.id}
                  pathway={pathway}
                />
              ))}
            </motion.div>

            <Pagination
              page={pathwayPage}
              totalPages={totalPathwayPages}
              onPageChange={setPathwayPage}
              totalLabel={`${totalPathways} pathway${totalPathways === 1 ? "" : "s"}`}
            />
          </>
        )}
      </section>

      {/* Individual courses reachable through those pathways */}
      <section id="audience-courses-section" tabIndex={-1} className="mx-auto max-w-6xl px-6 pt-16 scroll-mt-28">
        <AudienceSectionHeader
          eyebrow="Individual Classes"
          heading="Build your skills, one course at a time"
          description="Focus on what matters to you. Explore individual courses from this audience’s pathways."
          count={coursesQuery.isSuccess ? totalCourses : null}
          countLabel="course"
          action={
            <Link
              href={ROUTES.STORE}
              className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-widest text-moss transition-all hover:gap-2.5 hover:text-pine"
            >
              Full Course Store
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {coursesQuery.isLoading && <AudienceCardGridSkeleton count={3} variant="course" />}

        {coursesQuery.isError && (
          <SectionError
            title="Failed to Load Courses"
            error={coursesQuery.error}
            onRetry={() => coursesQuery.refetch()}
          />
        )}

        {!coursesQuery.isLoading && !coursesQuery.isError && courses.length === 0 && (
          <div className="rounded-panel border border-dashed border-line bg-paper/60 py-4">
            <EmptyState
              icon={BookOpen}
              size="lg"
              label="No courses here yet"
              description="Courses appear once this audience's pathways have published courses in them."
              action={
                <Link
                  href={ROUTES.STORE}
                  className="inline-flex items-center gap-1.5 rounded-full bg-pine px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-widest text-paper transition hover:bg-moss"
                >
                  Browse All Courses
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
          </div>
        )}

        {!coursesQuery.isLoading && !coursesQuery.isError && courses.length > 0 && (
          <>
            <motion.div
              id="audience-courses-grid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`grid grid-cols-1 gap-8 transition-opacity duration-200 md:grid-cols-2 lg:grid-cols-3 ${
                coursesQuery.isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              {courses.map((course) => (
                <StoreCourseCard
                  key={course.id}
                  course={course}
                  isInCart={isInCart(course.id)}
                  isPending={isCartActionPending(course.id)}
                  canPurchase={canUseCart}
                  onToggleCart={toggleCourse}
                  isWishlisted={wishlist.isInWishlist(course.id)}
                  isWishlistPending={wishlist.isPending(course.id)}
                  onToggleWishlist={canUseCart ? wishlist.toggleCourse : undefined}
                />
              ))}
            </motion.div>

            <Pagination
              page={coursePage}
              totalPages={totalCoursePages}
              onPageChange={setCoursePage}
              totalLabel={`${totalCourses} course${totalCourses === 1 ? "" : "s"}`}
            />
          </>
        )}
      </section>
    </div>
  );
}
