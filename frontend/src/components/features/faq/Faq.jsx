"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  HelpCircle,
  GraduationCap,
  ClipboardCheck,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  ArrowRight,
  ArrowUpRight,
  MessageCircleQuestion,
  Sparkles,
  ShieldCheck,
  Clock,
  Users,
  LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FAQ_CATEGORIES } from "@/constants/faq";
import { ROUTES } from "@/constants/routes";
import ContactAdvisorEntry from "./ContactAdvisorEntry";

const CATEGORY_ICONS = {
  GraduationCap,
  ClipboardCheck,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
};

const TOTAL_QUESTIONS = FAQ_CATEGORIES.reduce(
  (sum, category) => sum + category.items.length,
  0
);

const POPULAR_FAQS = FAQ_CATEGORIES.map((category) => ({
  category,
  item: category.items[0],
})).slice(0, 3);

function CategoryIcon({ name, className }) {
  const Icon = CATEGORY_ICONS[name] ?? HelpCircle;
  return <Icon className={className} />;
}

export default function Faq() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [openKey, setOpenKey] = useState(null);
  const pageRef = useRef(null);

  const visibleCategories = useMemo(() => {
    if (activeCategory === "all") return FAQ_CATEGORIES;
    return FAQ_CATEGORIES.filter((category) => category.id === activeCategory);
  }, [activeCategory]);

  // Reveal cards/sections as they scroll into view, without hiding content if JS is unavailable.
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set();
    let observer;
    const setup = () => {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      if (preference.matches || !window.IntersectionObserver) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const animation = entry.target.animate(
              [
                { opacity: 0, transform: "translateY(18px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              {
                duration: 600,
                delay: Number(entry.target.dataset.revealDelay || 0),
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "backwards",
              }
            );
            animations.add(animation);
            animation.onfinish = () => animations.delete(animation);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.08 }
      );
      pageRef.current
        ?.querySelectorAll("[data-reveal]")
        .forEach((element) => observer.observe(element));
    };
    setup();
    preference.addEventListener("change", setup);
    return () => {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      preference.removeEventListener("change", setup);
    };
  }, [visibleCategories]);

  const jumpToItem = (categoryId, itemKey) => {
    setActiveCategory("all");
    setOpenKey(itemKey);
    requestAnimationFrame(() => {
      setTimeout(() => {
        document
          .getElementById(`faq-item-${itemKey}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
    });
  };

  return (
    <div
      id="faq-page-container"
      ref={pageRef}
      className="cn-page-bg min-h-screen"
    >
      {/* Hero */}
      <section className="relative overflow-hidden isolate border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-[-10%] w-lg h-128 rounded-full bg-pine/10 blur-[120px] animate-pulse"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-[-10%] w-md h-112 rounded-full bg-gold/10 blur-[110px] animate-pulse"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-160 h-160 rounded-full bg-sky/10 blur-[140px] animate-pulse"
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-12 pb-10 md:pt-16 md:pb-12 flex flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-pine/10 border border-pine/15 px-4 py-2 rounded-full text-pine font-sans uppercase tracking-widest text-xs font-medium mb-5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Knowledge Base &amp; Support
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl md:text-6xl font-serif text-ink tracking-tight leading-[0.95] font-light max-w-3xl"
          >
            Answers for Every Step of the Incubator
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-muted text-sm md:text-lg font-sans font-light leading-relaxed max-w-2xl mt-4"
          >
            Curriculum structure, admissions, school licensing, the Student
            Portal, and billing — everything prospective scholars, parents,
            and partner institutions ask us most.
          </motion.p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        {/* Popular questions */}
        {activeCategory === "all" && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-gold font-sans uppercase tracking-widest text-xs font-medium">
                Most Referenced
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {POPULAR_FAQS.map(({ category, item }, idx) => (
                <motion.button
                  key={category.id}
                  id={`faq-popular-${category.id}`}
                  data-reveal
                  data-reveal-delay={idx * 90}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => jumpToItem(category.id, `${category.id}-0`)}
                  className="group text-left bg-paper border border-line p-5 rounded-card shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${category.tint}`}
                    >
                      <CategoryIcon name={category.icon} className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-pine group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                  </div>
                  <p className="text-gold font-sans uppercase tracking-widest text-[10px] font-semibold mb-2">
                    0{idx + 1} &middot; {category.label}
                  </p>
                  <h3 className="font-serif text-base font-light tracking-tight text-ink leading-snug">
                    {item.question}
                  </h3>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Content: sticky category rail + accordions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Mobile category scroller */}
          <div className="lg:hidden -mx-6 px-6 flex gap-2 overflow-x-auto pb-1">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setActiveCategory("all")}
              className={`relative shrink-0 px-4 py-2 rounded-full text-xs font-sans font-semibold uppercase tracking-widest transition-colors duration-200 ${
                activeCategory === "all"
                  ? "text-paper"
                  : "bg-paper text-muted border border-line"
              }`}
            >
              {activeCategory === "all" && (
                <motion.span
                  layoutId="faq-mobile-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className="absolute inset-0 bg-pine rounded-full shadow-soft"
                />
              )}
              <span className="relative z-10">All Topics</span>
            </motion.button>
            {FAQ_CATEGORIES.map((category) => (
              <motion.button
                key={category.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => setActiveCategory(category.id)}
                className={`relative shrink-0 px-4 py-2 rounded-full text-xs font-sans font-semibold uppercase tracking-widest transition-colors duration-200 ${
                  activeCategory === category.id
                    ? "text-paper"
                    : "bg-paper text-muted border border-line"
                }`}
              >
                {activeCategory === category.id && (
                  <motion.span
                    layoutId="faq-mobile-pill"
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    className="absolute inset-0 bg-pine rounded-full shadow-soft"
                  />
                )}
                <span className="relative z-10">{category.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Desktop sticky sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="lg:sticky lg:top-28 space-y-6">
              <p className="text-ink font-sans uppercase tracking-widest text-xs font-semibold flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5 text-gold" />
                Browse by Topic
              </p>
              <nav className="space-y-1">
                <button
                  id="faq-filter-all"
                  onClick={() => setActiveCategory("all")}
                  className={`relative w-full flex items-center justify-between gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-sans transition-colors duration-200 ${
                    activeCategory === "all"
                      ? "text-ink font-semibold"
                      : "text-muted hover:text-ink hover:bg-paper/60"
                  }`}
                >
                  {activeCategory === "all" && (
                    <motion.span
                      layoutId="faq-sidebar-pill"
                      transition={{ type: "spring", stiffness: 500, damping: 36 }}
                      className="absolute inset-0 bg-paper border-l-2 border-pine rounded-xl shadow-soft"
                    />
                  )}
                  <span className="relative z-10">All Topics</span>
                  <span className="relative z-10 text-[11px] text-muted">
                    {TOTAL_QUESTIONS}
                  </span>
                </button>
                {FAQ_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    id={`faq-filter-${category.id}`}
                    onClick={() => setActiveCategory(category.id)}
                    className={`relative w-full flex items-center justify-between gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-sans transition-colors duration-200 ${
                      activeCategory === category.id
                        ? "text-ink font-semibold"
                        : "text-muted hover:text-ink hover:bg-paper/60"
                    }`}
                  >
                    {activeCategory === category.id && (
                      <motion.span
                        layoutId="faq-sidebar-pill"
                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                        className="absolute inset-0 bg-paper border-l-2 border-pine rounded-xl shadow-soft"
                      />
                    )}
                    <span className="relative z-10 text-left leading-snug">
                      {category.label}
                    </span>
                    <span className="relative z-10 text-[11px] text-muted shrink-0">
                      {category.items.length}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="pt-6 border-t border-line">
                <div
                  data-reveal
                  className="bg-pine/5 border border-pine/15 rounded-card p-5"
                >
                  <div className="w-9 h-9 rounded-full bg-pine/10 flex items-center justify-center text-pine mb-4">
                    <MessageCircleQuestion className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-sm font-serif font-light text-ink mb-1.5">
                    Can&apos;t find it here?
                  </p>
                  <p className="text-xs text-muted leading-relaxed mb-4">
                    Our advisory team replies to every intake within one
                    business day.
                  </p>
                  <Link
                    href={ROUTES.FUTURE_CLIENTS}
                    className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-pine hover:text-moss transition"
                  >
                    Talk to an advisor
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="lg:col-span-9">
            <div className="space-y-10">
              {visibleCategories.map((category, catIdx) => {
                  const fullCategory = FAQ_CATEGORIES.find(
                    (entry) => entry.id === category.id
                  );
                  const categoryIndex = FAQ_CATEGORIES.indexOf(fullCategory);
                  return (
                    <div key={category.id} id={`faq-category-${category.id}`}>
                      <div
                        data-reveal
                        data-reveal-delay={catIdx * 70}
                        className="flex items-start gap-4 mb-4"
                      >
                        <span className="font-serif text-3xl md:text-4xl font-light text-gold/50 leading-none mt-0.5">
                          {String(categoryIndex + 1).padStart(2, "0")}
                        </span>
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${category.tint}`}
                        >
                          <CategoryIcon name={category.icon} className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xl md:text-2xl font-serif font-light text-ink tracking-tight">
                            {category.label}
                          </h2>
                          <p className="text-muted text-xs font-sans uppercase tracking-widest mt-0.5">
                            {category.items.length}{" "}
                            {category.items.length === 1 ? "question" : "questions"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {category.items.map((item, idx) => {
                          const itemKey = `${category.id}-${idx}`;
                          const isOpen = openKey === itemKey;
                          return (
                            <div
                              key={itemKey}
                              id={`faq-item-${itemKey}`}
                              data-reveal
                              data-reveal-delay={idx * 50}
                              className={`bg-paper border rounded-panel overflow-hidden transition-all duration-300 ${
                                isOpen
                                  ? "border-gold/30 shadow-elevated"
                                  : "border-line shadow-soft hover:border-pine/30 hover:shadow-elevated"
                              }`}
                            >
                              <motion.button
                                id={`faq-trigger-${itemKey}`}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setOpenKey(isOpen ? null : itemKey)}
                                className="w-full py-4 px-5 flex items-center justify-between text-left gap-4 transition-colors hover:text-pine"
                              >
                                <span className="font-serif text-sm md:text-base font-light tracking-tight text-ink">
                                  {item.question}
                                </span>
                                <motion.span
                                  animate={{ rotate: isOpen ? 180 : 0 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                                  className={`w-8 h-8 rounded-full bg-porcelain border border-line flex items-center justify-center shrink-0 text-muted transition-colors duration-300 ${
                                    isOpen ? "text-gold border-gold/20 bg-gold/5" : ""
                                  }`}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </motion.span>
                              </motion.button>

                              <AnimatePresence initial={false}>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                  >
                                    <div className="pb-5 px-5 font-sans text-sm text-muted leading-relaxed border-t border-line pt-3.5 bg-porcelain/40 select-text">
                                      {item.answer}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        {/* Still have questions CTA */}
        <section id="faq-cta-section" className="mt-16">
          <div
            id="faq-cta-card"
            data-reveal
            className="relative overflow-hidden isolate bg-ink border border-white/10 rounded-panel p-8 md:p-11 shadow-elevated"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 w-96 h-96 rounded-full bg-gold/15 blur-[110px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 -bottom-24 w-72 h-72 rounded-full bg-pine/40 blur-[100px]"
            />

            <div className="relative">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="max-w-xl text-left">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-gold font-sans uppercase tracking-widest text-[11px] font-bold mb-4">
                    <MessageCircleQuestion className="w-3.5 h-3.5" />
                    Still Have Questions?
                  </span>
                  <h2 className="text-2xl md:text-4xl font-serif font-light leading-[0.95] tracking-tight text-paper mb-4">
                    Talk to the Senior Advisory Council.
                  </h2>
                  <p className="text-sage/70 text-sm md:text-base leading-relaxed">
                    Send your question directly to an advisor and get a reply
                    in your student portal — no forms, no waiting on an intake
                    review.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
                  <ContactAdvisorEntry
                    id="btn-faq-cta-ask-advisor"
                    icon={ArrowRight}
                    className="w-full sm:w-auto bg-gold hover:brightness-95 text-ink font-sans font-extrabold uppercase tracking-widest text-sm px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition duration-300 shadow-md"
                  />
                  <Link
                    id="btn-faq-cta-curriculum"
                    href={ROUTES.CURRICULUM}
                    className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-paper border border-white/15 font-sans font-semibold uppercase tracking-widest text-sm px-8 py-3.5 rounded-full flex items-center justify-center transition duration-300"
                  >
                    Browse Curriculum
                  </Link>
                </div>
              </div>

              <div className="relative flex flex-wrap items-center gap-x-8 gap-y-3 mt-7 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-paper/70 text-xs font-sans">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  FERPA &amp; COPPA Secure
                </div>
                <div className="flex items-center gap-2 text-paper/70 text-xs font-sans">
                  <Clock className="w-4 h-4 text-gold" />
                  Advisor replies within 24 hours
                </div>
                <div className="flex items-center gap-2 text-paper/70 text-xs font-sans">
                  <Users className="w-4 h-4 text-gold" />
                  1:1 matched to a senior advisor
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
