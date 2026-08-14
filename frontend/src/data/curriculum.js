

export const CURRICULUM_TIERS = [
  {
    id: 'tier-1',
    number: 'Tier 1',
    title: 'Youth Athletes Foundation',
    subtitle: '8th-10th Grade Athletic Readiness',
    desc: 'Foundational framework mapping for prospective collegiate scouts. Instills critical lifestyle management, body coordinate optimization, and scout exposure rules before high-stakes windows open.',
    audience: 'Middle School & Early High School Athletes',
    focusAreas: ['Social Media Audit', 'Daily Drill Habits', 'College Coach Communication Syntax'],
    outcomes: ['3-Year Athletic Portfolio', 'Certified Compliant Media Footprint'],
    estimatedDuration: '12 Months',
    tag: 'Athletic'
  },
  {
    id: 'tier-1b',
    number: 'Tier 1b',
    title: 'Parent Playbook',
    subtitle: 'Elite Sports Maze Navigation',
    desc: 'Empowers parents and guardians with tactical knowledge on club team economics, showcase selection metrics, agency traps, and emotional stabilization tactics for peak youth development.',
    audience: 'Parents of High-Potential Youth',
    focusAreas: ['Showcase Valuation Matrices', 'Pre-Contract Inspection Guidelines', 'Support Systems'],
    outcomes: ['Parental Advisory Scorecard', 'Showcase Exposure Planner Profile'],
    estimatedDuration: 'Ongoing',
    tag: 'Foundation'
  },
  {
    id: 'tier-1c',
    number: 'Tier 1c',
    title: 'International Prospect',
    subtitle: 'Assimilating Global Masterminds',
    desc: 'Specialized visa compliance, Cultural Assimilation Indexes, educational credential transcripts conversion, and international player representation protocols.',
    audience: 'Global Scholars & Foreign Recruits',
    focusAreas: ['F-1/I-20 Technical Compliance', 'Intercultural Soft-Skill Seminars', 'ESL Cognitive Training'],
    outcomes: ['Certified Legal Eligibility Audit', 'Dual-Linguistic Presentation Portfolio'],
    estimatedDuration: '6-9 Months',
    tag: 'Foundation'
  },
  {
    id: 'tier-2',
    number: 'Tier 2',
    title: 'Recruiting Window Mastery',
    subtitle: 'Closing Elite D1/D3 Offers',
    desc: 'Maximize exposure during key showcase windows. Includes automated highlight feedback, mock press simulation, and negotiation frameworks to secure commitments.',
    audience: 'High School Juniors & Seniors',
    focusAreas: ['NCAA Eligibility Center Auditing', 'Verbal Commitment Optimization', 'Recruiting Video Architecture'],
    outcomes: ['Active D1 College Pipeline Connection', 'Official Verbal Contract Review'],
    estimatedDuration: '8 Months',
    tag: 'Athletic'
  },
  {
    id: 'tier-3',
    number: 'Tier 3',
    title: 'Early Academic Elite',
    subtitle: '7th-10th Grade Ivy League Positioning',
    desc: 'Elite intellectual positioning for highly selective institutions. Builds distinct extracurricular spike profiles, advanced reading, and standardized analytical foundation.',
    audience: 'Intellectually Ambitious Underclassmen',
    focusAreas: ['Academic Spike Profile Architecture', 'Classic Literature Synopses', 'Early Competition Frameworks'],
    outcomes: ['Personal Extracurricular Spike Roadmap', 'Advanced STEM/Humanities Writing Samples'],
    estimatedDuration: '18 Months',
    tag: 'Academic'
  },
  {
    id: 'tier-4',
    number: 'Tier 4',
    title: 'Late Academic Elite',
    subtitle: '11th-12th Grade Ivy & Career Launches',
    desc: 'Strategic execution of common applications. High-tier personal statement polishing, letter of recommendation strategy, and professional internship bridging.',
    audience: 'High School Upperclassmen (Scholars)',
    focusAreas: ['Common App Essay Polishing', 'Elite Recommendation Solicitations', 'Mock Interview Drills'],
    outcomes: ['Stellar Admission Coverages', 'Integrated Scholarship Target Strategy'],
    estimatedDuration: '6-9 Months',
    tag: 'Academic'
  },
  {
    id: 'tier-5',
    number: 'Tier 5',
    title: 'The Pathfinder Paradigm',
    subtitle: 'Real-World Craft & Economy Mastery',
    desc: 'For builders and high-potential practitioners outside standard corporate/academic lines. Focuses on advanced gig-economy positioning, digital leverage, and trade pathways.',
    audience: 'Independent Builders & Trade Masters',
    focusAreas: ['Digital Content Arbitrage', 'Local Business Structuring', 'Applied Automation Tools'],
    outcomes: ['Fully Operational Digital Cashflow Unit', 'Business License Protocol Audit'],
    estimatedDuration: '6 Months',
    tag: 'Vocational'
  },
  {
    id: 'tier-6',
    number: 'Tier 6',
    title: 'Elite Pros & Collegiate NIL',
    subtitle: 'NIL Deals, Brands & Generational Wealth',
    desc: 'Strategic operations inside NCAA NIL laws. Designing sustainable personal brands, reviewing legal contracts, tax structuring, and mental stability under intense media scrutinization.',
    audience: 'Active College Competitors & Professional Drafts',
    focusAreas: ['LLC Tax Structuring', 'NIL Brand Integrity Score', 'Fiduciary Selection Methodologies'],
    outcomes: ['Personal Brand Playbook', 'Comprehensive Asset Allocation Blueprint'],
    estimatedDuration: 'Year-Round',
    tag: 'Athletic'
  },
  {
    id: 'tier-7',
    number: 'Tier 7',
    title: 'Startup & Scale Mastery',
    subtitle: 'Entrepreneurial Incubator Foundations',
    desc: 'Converting abstract ideas into scalable technological and product ventures. Guides on writing agile pitches, securing venture backing, and selecting dynamic teams.',
    audience: 'Aspiring Tech & Craft Founders',
    focusAreas: ['Capitalization Cap Table Audits', 'MVP Prototyping Systems', 'Venture Capital Presentation Pitching'],
    outcomes: ['Interactive Slide Pitchdeck', 'Operational MVP Deployment Scheme'],
    estimatedDuration: '12 Months',
    tag: 'Professional'
  },
  {
    id: 'tier-8',
    number: 'Tier 8',
    title: 'Executive Mastery Program',
    subtitle: 'C-Suite Navigation & Systemic Cognitive Drills',
    desc: 'Elite executive decision framing. Focuses on identifying institutional cognitive bias, negotiating mega mergers, and managing large corporate structures under crisis.',
    audience: 'Active Business Heads & Directors',
    focusAreas: ['Systemic Strategy Architecture', 'Crisis Scenario Response Protocol', 'Emotional Intelligence Diagnostics'],
    outcomes: ['Corporate Vision Deployment Directive', 'Certified Strategic Cognitive Audit'],
    estimatedDuration: '6 Months',
    tag: 'Professional'
  },
  {
    id: 'tier-9',
    number: 'Tier 9',
    title: 'Legacy & Wealth Preservation',
    subtitle: 'Philanthropy, Foundations & Family Offices',
    desc: 'The ultimate pinnacle tier. Structure multi-generational trusts, charitable endowment funds, strategic family offices, and build global impact through curated philanthropy.',
    audience: 'High-Net-Worth Benefactors & Generational Stewards',
    focusAreas: ['Trust Fund Architecture', 'Impact Philanthropy Maps', 'Endowment Stewardship Matrix'],
    outcomes: ['Axiological Family Charter', 'Endowment Allocation Audit Blueprint'],
    estimatedDuration: 'Custom Iterative',
    tag: 'Legacy'
  },
  {
    id: 'tier-v1',
    number: 'Tier V1',
    title: 'Vocational Foundations & Apprentice Safety',
    subtitle: 'Practical Trade Readiness & Safety Covenants',
    desc: 'Establishes high-performance work standards, regulatory site protection, OSHA safety covenants, and technical tool mastery. Tailored specifically for students seeking non-college tracks to rapid income and long-term security.',
    audience: 'Early Career Craftsmen & Vocational High-Schoolers',
    focusAreas: ['OSHA 10-Hour Site Safety', 'Industrial Blueprints & Drawings', 'Apprentice Labor Relations'],
    outcomes: ['Comprehensive Site Safety Certification', 'Verified Apprentice Technical Skill Matrix'],
    estimatedDuration: '6 Months',
    tag: 'Vocational'
  },
  {
    id: 'tier-v2',
    number: 'Tier V2',
    title: 'Independent Contracting & Commercial Bidding',
    subtitle: 'Contractual Structures, Liability, & Bid Optimization',
    desc: 'Empowers tradesmen with financial independence. Gain a profound mastery of general contracting mechanics: creating premium project bids, labor cost calculation, liability isolation, and indemnity contracts.',
    audience: 'Advanced Apprentices & Future General Contractors',
    focusAreas: ['Work Breakdown Estimators', 'General Liability & Bonding Codes', 'Subcontractor Covenant Audits'],
    outcomes: ['Interactive Commercial Bidding System', 'Legally Tested Service Agreement Template'],
    estimatedDuration: '8 Months',
    tag: 'Vocational'
  },
  {
    id: 'tier-v3',
    number: 'Tier V3',
    title: 'The Master Craftsman Empire',
    subtitle: 'Advanced Licensure, SME Scaling, & Dispatch CRM Systems',
    desc: 'Transform local craftsmanship into a scalable regional enterprise. Acquire advanced state trade board licensing, construct bulk-materials hedge plans, and implement automated customer-management CRM and dispatch routing.',
    audience: 'Independent Trade Founders & Specialty Shop Operators',
    focusAreas: ['State Board Licensing Covenants', 'SME Fleet & Crew Management', 'Local Service Franchising Plans'],
    outcomes: ['Certified State License Exam Ready Portfolio', 'Multi-Scale Trades Operational Playbook'],
    estimatedDuration: '12 Months',
    tag: 'Vocational'
  }
];

// Daily Drill question bank now lives in the backend (`daily_drill` app,
// seeded via `python manage.py seed_daily_drill`) so it can rotate per day
// and track real per-student attempts — see services/dailyDrillService.js.

export const ADVISOR_PERSONAS = [
  {
    id: 'recruiter',
    name: 'Coach Vance Miller',
    title: 'Executive D1 recruiting & scouting counsel',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    quote: 'Scouts do not just look at stats. We scout your posture under pressure, your social media grammar, and your recovery metrics.',
    specialty: 'Collegiate Recruitment Covenants, Scout Exposure, Team Culture Audit',
    systemPrompt: 'You are Coach Vance Miller, an experienced, pragmatic, and tough D1 Collegiate Recruiter. You speak clearly with a realistic, slightly gravelly tone. Focus on raw competitive posture, coachability, social footprint compliance, and physiological performance. Provide direct feedback to the student with clear, blunt action items.'
  },
  {
    id: 'legal',
    name: 'Amanda Ross, Esq.',
    title: 'Lead NIL Specialist & Intellectual Property Attorney',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    quote: 'Always protect your unilateral trademark right. A bad signature in the pre-season can lock your identity out of your own domain for a decade.',
    specialty: 'Trademark Governance, NIL Regulatory Code, Redlining Non-Competes',
    systemPrompt: 'You are Amanda Ross, Esq., an elite sports and intellectual property attorney. You are intellectual, forensic, and analytical. You point out legal loopholes, non-compete risks, trademark traps, and compliance risks under modern NCAA and State regulations. Structure your advice in numbered legally sound items.'
  },
  {
    id: 'psychology',
    name: 'Dr. Simone Chen',
    title: 'Head of High-Performance Neurobiology',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    quote: 'The heart and cortex must fire in coherent cycles. Cognitive wear is not a badge of honor; it is a mechanical failure in planning.',
    specialty: 'Circadian Stabilization, High-pressure Focus Synthesis, Impulsivity Diagnostics',
    systemPrompt: 'You are Dr. Simone Chen, a neurobiologist and elite performance psychologist working with world-class athletes and CEOs. You talk in terms of cognitive load, nervous recovery indexes, baseline cortisol containment, and system routines. Your suggestions are highly scientific, elegant, and action-oriented.'
  },
  {
    id: 'legacy',
    name: 'Richard Sterling',
    title: 'Steward of Multi-Family Offices & Philanthropy',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    quote: 'Wealth without axiological architecture is merely numbers. We build legacy portfolios that preserve character across generations.',
    specialty: 'Generational Philanthropy, Trust Formulations, Brand Character Continuity',
    systemPrompt: 'You are Richard Sterling, a sophisticated and empathetic legacy office manager guiding extremely high net worth individuals on character continuity and values-driven endowment preservation. You speak with warm authority, focusing on corporate responsibility, trust structure ethics, and generational impact.'
  }
];
