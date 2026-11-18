"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { LICENCE_LEVELS } from "@/data/schoolLicensing";

// "Request a licensing briefing."
//
// There is no backend endpoint for a school enquiry, and a form that silently
// discarded one would be worse than a form that does nothing. So submitting
// opens the visitor's own mail client with everything they typed already in
// the message: they see exactly what is sent and to whom, and nothing
// disappears into a void.
//
// >>> Set this to the real partnerships inbox before this page goes live. <<<
// Until then it is a deliberately invalid placeholder rather than a guessed
// address dressed up as a real one.
const BRIEFING_EMAIL = "partnerships@example.invalid";

const INCLUDES = [
  "30-minute video call",
  "A live portal walkthrough",
  "A written quote for your school",
];

const FIELD =
  "h-[50px] w-full rounded-cn-sm border border-cn-muted bg-white px-4 text-cn-ink transition-colors duration-150 hover:border-cn-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent";
const LABEL = "text-cn-sm font-semibold text-cn-ink";

export default function SchoolsBriefing({ sectionRef, estimate }) {
  const [form, setForm] = useState({
    name: "",
    role: "",
    school: "",
    email: "",
    seats: "",
    notes: "",
  });

  function update(key) {
    return (event) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const level = LICENCE_LEVELS.find((item) => item.id === estimate?.levelId);
    const lines = [
      `Name: ${form.name}`,
      `Role: ${form.role}`,
      `School or academy: ${form.school}`,
      `Work email: ${form.email}`,
      `Students: ${form.seats}`,
      "",
      // What they were looking at when they asked, so a reply can start from
      // the same numbers instead of asking for them again.
      estimate && level
        ? `Estimate on screen: ${level.name} at $${level.rate} per student / year for ${estimate.seats} students, about $${estimate.fee.toLocaleString()} a year.`
        : "",
      "",
      form.notes,
    ].filter(Boolean);

    const subject = `Licensing briefing request - ${form.school || "school"}`;
    window.location.href = `mailto:${BRIEFING_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

  return (
    <section
      id="schools-briefing"
      ref={sectionRef}
      className="cn-section scroll-mt-24"
    >
      <div className="cn-container">
        <div
          data-cn-reveal
          className="cn-reveal grid overflow-hidden rounded-cn-lg border border-cn-rule shadow-cn-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        >
          <div className="relative grid content-start gap-4 overflow-hidden bg-cn-accent px-10 py-16 text-cn-on-ink">
            <img
              src="/images/design/mark-white.png"
              alt=""
              aria-hidden="true"
              width={220}
              height={269}
              className="pointer-events-none absolute -right-10 -bottom-12 w-[220px] opacity-[0.14]"
            />
            <h2 className="relative text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-on-ink">
              Request a licensing briefing.
            </h2>
            <p className="relative text-cn-on-ink-2">
              Our partnerships team walks your leadership through the
              curriculum, the portal and pricing for your student body.
            </p>
            <ul className="relative m-0 grid list-none gap-2 p-0 text-cn-sm text-cn-on-ink-2">
              {INCLUDES.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check
                    className="h-4 w-4 text-cn-accent-soft"
                    strokeWidth={2.4}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 bg-white px-10 py-16">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1">
                <label htmlFor="b-name" className={LABEL}>
                  Your name
                </label>
                <input
                  id="b-name"
                  className={FIELD}
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={update("name")}
                />
              </div>
              <div className="grid gap-1">
                <label htmlFor="b-role" className={LABEL}>
                  Role
                </label>
                <input
                  id="b-role"
                  className={FIELD}
                  placeholder="Athletic director, principal"
                  value={form.role}
                  onChange={update("role")}
                />
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <label htmlFor="b-school" className={LABEL}>
                  School or academy
                </label>
                <input
                  id="b-school"
                  className={FIELD}
                  required
                  value={form.school}
                  onChange={update("school")}
                />
              </div>
              <div className="grid gap-1">
                <label htmlFor="b-email" className={LABEL}>
                  Work email
                </label>
                <input
                  id="b-email"
                  type="email"
                  className={FIELD}
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                />
              </div>
              <div className="grid gap-1">
                <label htmlFor="b-seats" className={LABEL}>
                  Students
                </label>
                <input
                  id="b-seats"
                  type="number"
                  min="1"
                  className={FIELD}
                  value={form.seats}
                  onChange={update("seats")}
                />
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <label htmlFor="b-notes" className={LABEL}>
                  Anything else?
                </label>
                <textarea
                  id="b-notes"
                  rows={4}
                  className={`${FIELD} h-auto py-3`}
                  value={form.notes}
                  onChange={update("notes")}
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex h-[50px] w-fit items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-cn-base font-semibold text-white shadow-cn-1 transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2"
            >
              Send the request
              <ArrowRight className="h-[18px] w-[18px]" />
            </button>

            <p className="text-cn-xs text-cn-muted">
              This opens your email app with the details filled in, so you can
              see exactly what is sent before it goes.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
