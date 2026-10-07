/**
 * Full FAQ catalog for the dedicated /faq page, grouped by topic.
 * Icon/tint keys are resolved in the Faq component (keeps this file framework-agnostic).
 */
export const FAQ_CATEGORIES = [
  {
    id: "program",
    label: "Program & Curriculum",
    icon: "GraduationCap",
    tint: "bg-gold/15 text-[#8a6f2e]",
    items: [
      {
        question: "What exactly is the Cool Nerds Incubator?",
        answer:
          "Cool Nerds is a progressive, multi-tier educational incubator built for high-performance scholars, athletic prospects, and young founders. Each tier delivers structured modules spanning NCAA/NIL compliance, athletic recruiting, academic positioning, early-stage venture mechanics, and multi-generational family office organization.",
      },
      {
        question: "How is the curriculum structured across tiers?",
        answer:
          "The curriculum is organized into sequential tiers, each with its own focus areas, estimated duration, and outcomes. Earlier tiers build foundational scholastic and athletic readiness, while later tiers introduce venture formation, trust structures, and advanced compliance scenarios. You can review every tier's breakdown on the Curriculum page.",
      },
      {
        question: "Is Cool Nerds only for student-athletes?",
        answer:
          "No. Cool Nerds features parallel development paths. While early tiers cover athlete scouting, highlighting, and NIL contract rules, several tiers are dedicated entirely to academic positioning, Ivy-level essay review, pre-seed startup templates, and elite cognitive performance strategies.",
      },
      {
        question: "How long does it take to complete a tier?",
        answer:
          "Pacing is self-directed. Most scholars complete a tier's modules and daily drills within a few weeks when working consistently, but there is no hard deadline — progress is tracked per student in the Student Portal and you can move at the pace that fits your schedule.",
      },
    ],
  },
  {
    id: "enrollment",
    label: "Enrollment & Admissions",
    icon: "ClipboardCheck",
    tint: "bg-sage text-moss",
    items: [
      {
        question: "How do I enroll as a student or parent/guardian?",
        answer:
          "Prospective students, parents, and guardians start through our Future Clients intake flow, where you submit a strategic dossier profile. This generates an evaluation clearance token and lets you configure a custom plan before onboarding into the portal.",
      },
      {
        question: "Why are there regional caps or vacancy quotas?",
        answer:
          "Because high-performance recruitment matching and counseling resources are limited, we manage cohort placements through strict registration quotas. This keeps counselor-to-student ratios healthy and ensures every enrolled scholar receives genuine, individualized attention.",
      },
      {
        question: "Can parents or guardians customize an enrollment plan?",
        answer:
          "Yes. The Future Clients intake tab lets parents and guardians configure a custom plan around tier selection, pacing, and support needs before a student is onboarded, rather than being locked into a single fixed package.",
      },
      {
        question: "What happens after I submit my intake dossier?",
        answer:
          "Your submission is reviewed against current cohort capacity. If a seat is available, you'll receive onboarding instructions to access the Student Portal; if your region or cohort is at capacity, you're placed on a prioritized waitlist and notified as spots open.",
      },
    ],
  },
  {
    id: "licensing",
    label: "School & Institutional Licensing",
    icon: "Landmark",
    tint: "bg-sky text-blue",
    items: [
      {
        question: "How does school or institutional licensing work?",
        answer:
          "We license the complete Cool Nerds digital framework to select high schools, prep schools, collegiate athletic conferences, and regional sports academies. Partner institutions receive full system guides, classroom-ready materials, and progress dashboards to reduce institutional liability and track compliance outcomes.",
      },
      {
        question: "What's the difference between the licensing tiers?",
        answer:
          "Gold covers the standard core modules for athletic and scholastic readiness. Platinum adds institutional dashboard overlays, custom branding, and compliance alerts across a wider tier range. Legacy unlocks the full curriculum portfolio plus Trust Office guidance and live advisory webinars. Full pricing and scope comparisons are available on the Partnerships page.",
      },
      {
        question: "Can a partner institution white-label the student experience?",
        answer:
          "Yes. Licensed partners can apply custom school insignias, athletic colors, and counselor communications to the student dashboard, while remaining fully compliant with FERPA and COPPA student privacy regulations.",
      },
      {
        question: "How do we request a licensing briefing?",
        answer:
          "Visit the Partnerships page to run our cost and impact simulator for your student body size and licensing tier, then request a licensing briefing directly — our educational covenants coordinator will follow up to schedule a call.",
      },
    ],
  },
  {
    id: "portal",
    label: "Student Portal & Technology",
    icon: "LayoutDashboard",
    tint: "bg-lavender text-pine",
    items: [
      {
        question: "What is the Student Portal and what are daily drills?",
        answer:
          "The Student Portal is where enrolled scholars apply what they've learned through interactive, scenario-based drills — such as redline contract auditing, LLC setup reviews, and recovery checklists — to build real-world compliance readiness and earn verifiable credentials.",
      },
      {
        question: "What credentials or badges can students earn?",
        answer:
          "As students complete tiers, modules, and drills, the portal issues diagnostic badges and progress credentials that can be shared with counselors, coaches, or institutions as verifiable proof of completed work.",
      },
      {
        question: "Is student data kept private and secure?",
        answer:
          "Yes. Every portal experience, including white-labeled institutional deployments, is built to operate within FERPA and COPPA student privacy requirements, and access is protected behind authenticated, role-based accounts.",
      },
      {
        question: "Can I use the Student Portal on mobile devices?",
        answer:
          "Yes. The portal is fully responsive and works in any modern mobile browser, so students can complete drills and review curriculum content from a phone or tablet as well as desktop.",
      },
    ],
  },
  {
    id: "support",
    label: "Billing & Support",
    icon: "LifeBuoy",
    tint: "bg-rose/60 text-clay",
    items: [
      {
        question: "Is there a store for program materials or merchandise?",
        answer:
          "Yes. Our Strategic Store offers program materials and merchandise that complement the curriculum. You can browse and purchase directly from the Store page once logged in.",
      },
      {
        question: "Who do I contact if I have a question that isn't answered here?",
        answer:
          "You can reach our advisory team through the Future Clients intake flow, or use the live concierge chat available from the homepage for a quicker, conversational answer to program and enrollment questions.",
      },
      {
        question: "Does Cool Nerds offer refunds or plan changes?",
        answer:
          "Plan and licensing terms are confirmed during onboarding or the licensing briefing for institutional partners. If your circumstances change, reach out through the Future Clients intake flow and our advisory team will work with you on adjusting your plan.",
      },
      {
        question: "Do you work with schools outside a standard academic calendar?",
        answer:
          "Yes. Licensing and cohort timing are configured per institution during the partnership briefing, so year-round programs, summer academies, and non-traditional calendars can all be accommodated.",
      },
    ],
  },
];

export const INDEX_FAQ_ITEMS = [
  {
    question: "What is the Cool Nerds Incubator & 11-Tier Curriculum?",
    answer:
      "Cool Nerds is a progressive, 11-Tier educational incubator designed for high-performance scholars, athletic prospects, and young founders. Our curriculum bridges the massive gaps between raw potential and professional execution—delivering highly structured modules on NCAA/NIL compliance, athletic recruiting, academic college spikes, early-stage venture mechanics (such as SAFE agreements), and multi-generational family office/trust organization rules.",
  },
  {
    question: "How does the school licensing and partnership model work?",
    answer:
      "We license our digital curriculum and framework to select High Schools, Prep Schools, Collegiate Athletic Conferences, Regional Sports Academies, and private networks seeking to maximize student-athlete success. Partner institutions receive full system guides, classroom-ready slide decks, print-ready legacy syllabus packages, and progress dashboards to reduce institutional liability and secure candidate compliance track records.",
  },
  {
    question: "What is the role of the Student Portal and daily compliance drills?",
    answer:
      "The interactive Student Portal allows registered scholars and athletes to apply knowledge or certified progress with interactive modules. By completing tactical scenario-based drills—such as redline contract auditing, LLC setup reserves, and mental recovery checklists—users build real-world compliance readiness, receive diagnostic badges, and generate verifiable credentials.",
  },
  {
    question: "Is this curriculum focused strictly on sports and athletic recruits?",
    answer:
      "No. Cool Nerds features parallel development paths. While early athlete scouting, highlighting, and NIL contract rules are prominent under certain tiers, many tiers (such as Tiers 3, 4, 7, and 8) focus entirely on academic college statement spikes, Ivy-scout essay reviews, pre-seed startup SAFE template models, and elite cognitive behavioral focus strategies.",
  },
  {
    question: "How are regional caps and vacancy quotas managed for prospective cohorts?",
    answer:
      "Because high-performance recruitment matching and counseling resources are limited, our vacancy portal utilizes strict registration quotas. Prospective students, parents, or schools must submit a strategic dossier profile under our 'Future Clients' intake tab to generate an evaluation clearance token and stand out in selective cohort placements.",
  },
];
