"use client";

import React, { useEffect, useState } from 'react';
import {
  UserPlus, CheckCircle, ShieldAlert, Sparkles, Star, MapPin,
  Handshake, Trophy, Award, Landmark, ShieldCheck, Quote, BookOpen,
  Eye, EyeOff, Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import MultiSelect from '@/components/ui/MultiSelect';
import { getPublicCourses } from '@/services/coursesService';
import { submitFutureClientApplication } from '@/services/futureClientsService';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { toastError } from '@/lib/toast';

const AVATAR_GRADIENTS = [
  'from-pine to-moss',
  'from-clay to-rose',
  'from-sky to-lavender',
  'from-gold to-clay',
  'from-moss to-sky',
];

export default function FutureClients() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingCourses(true);

    (async () => {
      try {
        const response = await getPublicCourses();
        if (isMounted) setCourses(response?.data?.results || []);
      } catch {
        // Course list failing to load shouldn't block the rest of the page.
      } finally {
        if (isMounted) setIsLoadingCourses(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const courseOptions = courses.map((course) => ({
    value: course.id,
    label: `${course.title} ($${course.amount})`,
  }));

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toastError('Please fill in all required fields.');
      return;
    }
    if (selectedCourseIds.length === 0) {
      toastError('Please select at least one course.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitFutureClientApplication({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        courses: selectedCourseIds,
      });
      setSubmittedApplication(response?.data || null);
      setIsSubmitted(true);
      confetti({
        particleCount: 120,
        spread: 80,
        colors: ['#c7a85b', '#d96f5f', '#092d29'],
      });
    } catch (error) {
      toastError(getApiErrorMessage(error, 'Unable to submit your application. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetApplication = () => {
    setIsSubmitted(false);
    setSubmittedApplication(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setSelectedCourseIds([]);
  };

  const COMPANY_PARTNERS = [
    {
      id: 'partner-1',
      name: 'Vance & Ross Compliance Legal',
      role: 'Core Legal Redlines & Athletic Regulations',
      desc: 'Our premier compliance partner providing redlined covenants, trademark registrations, and strategic legal audits for school portfolios.',
      location: 'New York, NY',
      status: 'Active Counsel',
      badge: 'Legal Shield'
    },
    {
      id: 'partner-2',
      name: 'Sterling Institutional Advisers',
      role: 'Trust Offices & Legacy Portfolios',
      desc: 'Expert wealth preservation advisor providing guidance on generational asset trusts and tax-advantaged financial frameworks.',
      location: 'Chicago, IL',
      status: 'Strategic Advisor',
      badge: 'Heritage Trust'
    },
    {
      id: 'partner-3',
      name: 'Pacific Sports Academy Alliance',
      role: 'High-Performance Curriculum Verification',
      desc: 'Coordinating student-athlete diagnostics and administrative training programs to satisfy NIL intellectual property standards.',
      location: 'Los Angeles, CA',
      status: 'Charter Partner',
      badge: 'Academic Audit'
    }
  ];

  const PREVIOUS_FEEDBACK = [
    {
      id: 'feedback-1',
      name: 'Kyler Richardson Jr.',
      role: 'Elite Quarterback, SEC Varsity Commit',
      sport: 'Football (D1)',
      school: 'University of Alabama',
      avatarText: 'KR',
      rating: 5,
      quote: "The 11-Tier TrueTrek Learning curriculum changed how I handle contract negotiation. Before getting on the portal, I had zero understanding of LLC incorporation and tax reserves. Now I run my own athletic brand securely and in absolute compliance with NCAA rules.",
      verifiedBadge: 'Scholar Athlete Alum'
    },
    {
      id: 'feedback-2',
      name: 'Elena Rostova',
      role: 'AAC National High-Jump Finalist & Academic Lead',
      sport: 'Track & Field (D1)',
      school: 'Stanford University',
      avatarText: 'ER',
      rating: 5,
      quote: "School administrators gave us NIL packets, but TrueTrek Learning provided a real-time simulation laboratory. Testing my compliance understanding on realistic contract scenarios in their daily drills took away all the legal anxiety. Highly recommended for any student athlete searching for serious direction.",
      verifiedBadge: 'Stanford Track Commit'
    },
    {
      id: 'feedback-3',
      name: 'Coach Marcus Vance Sr.',
      role: 'Athletic Recruiting Director & Compliance Liaison',
      sport: 'Multi-Sport Advisor',
      school: 'Metropolitan Prep Academy',
      avatarText: 'MV',
      rating: 5,
      quote: "As an athletic director, keeping my recruits eligible is my primary directive. TrueTrek Learning provides an impenetrable educational framework. All 42 of our senior recruits registered as clients, and we had zero compliance infractions this entire cycle.",
      verifiedBadge: 'Verified Athletic Director'
    },
    {
      id: 'feedback-4',
      name: 'Deborah Vance, Esq.',
      role: 'Sports Agent & Family Trust Trustee',
      sport: 'Legal Advisory',
      school: 'Vance & Associates Law',
      avatarText: 'DV',
      rating: 5,
      quote: "The strategic financial intelligence modules on this platform are top-tier. Typically we see athletes make rookie tax mistakes when sudden sponsorship wealth occurs. TrueTrek Learning models proper cash-flow reserving before they ever sign a deal.",
      verifiedBadge: 'Primary Trustee Counsel'
    },
    {
      id: 'feedback-5',
      name: 'Jordan Miller',
      role: 'PAC-12 Basketball Recruit & Brand Ambassador',
      sport: 'Basketball (D1)',
      school: 'University of Oregon',
      avatarText: 'JM',
      rating: 5,
      quote: "The War Room advisor console is incredible. Submitting potential deals and getting simulated redlined audits in seconds helped my family understand what to ask for in actual legal negotiations. This system gives you total strategic power.",
      verifiedBadge: 'Class of 2026 Commit'
    }
  ];

  return (
    <div id="future-clients-root" className="min-h-screen cn-page-bg py-12 px-4 sm:px-6 lg:px-8 text-ink leading-normal">

      {/* Decorative background grid pattern */}
      <div className="absolute inset-x-0 top-20 h-96 bg-gradient-to-b from-porcelain/50 to-transparent pointer-events-none -z-10" />

      <div id="future-clients-container" className="max-w-6xl mx-auto space-y-16">

        {/* HERO BANNER SECTION */}
        <header id="fc-hero-section" className="text-center space-y-4 max-w-3xl mx-auto pt-4 animate-fade-in text-left sm:text-center">
          <div className="inline-flex items-center gap-1.5 bg-gold/20 border border-gold/40 px-3 py-1 rounded-full text-pine text-xs font-sans uppercase tracking-widest font-medium mx-auto sm:mx-0">
            <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
            Elite Student-Athlete Placement Hub
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-light tracking-tight text-ink leading-[0.9]">
            Relational Onboarding &amp; On-Queue Placement
          </h2>
          <p className="text-muted text-sm sm:text-base font-light leading-relaxed">
            Register your active recruiting dossier to evaluate potential platform membership, compliance clearances, and 11-Tier academic integration. Selected prospects obtain secure access keys to our flagship NIL simulations.
          </p>
        </header>

        {/* SECTION: ABOUT FUTURE CLIENTS & PLATFORM VALUE PROPOSITION */}
        <section id="fc-about-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2 text-left">
          <div className="lg:col-span-7 bg-pine text-paper rounded-panel p-8 sm:p-10 shadow-elevated border border-moss/40 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-24 -top-24 w-72 h-72 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <span className="text-gold font-sans text-xs uppercase tracking-widest font-medium">PORTFOLIO PLACEMENT PATHWAYS</span>
              <h3 className="text-2xl sm:text-3xl font-serif font-light tracking-tight leading-snug">
                Why Submit Credentials For TrueTrek Learning Evaluation?
              </h3>
              <p className="text-paper/75 text-sm sm:text-sm font-light leading-relaxed">
                TrueTrek Learning represents the premier administrative and legal compliance portal for selective high-performance scholar-athletes. Because platform placement is protected by strict scholastic quotas and regional compliance caps, we require prospective student-athletes to submit formal intake dossiers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-paper/15">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span className="font-sans text-xs uppercase font-medium tracking-wider">FERPA-SAFE DATA LOCKS</span>
                  </div>
                  <p className="text-paper/60 text-xs font-light leading-normal">
                    Secure scholastic clearinghouse processes protect collegiate admissions standing and high-school eligibility.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gold">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span className="font-sans text-xs uppercase font-medium tracking-wider">11-TIER TRANSITION AUDIT</span>
                  </div>
                  <p className="text-paper/60 text-xs font-light leading-normal">
                    Successful intakes receive a complete diagnostic report reviewing the high-integrity framework pathways.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-paper/15 flex flex-wrap items-center justify-between gap-4 text-sm font-sans text-paper/70 relative z-10">
              <span className="flex items-center gap-1.5 font-bold">
                <Trophy className="w-4 h-4 text-gold" /> 1600+ Scholars Placed
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <Landmark className="w-4 h-4 text-gold" /> NCAA Tier-1 Certified
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div className="bg-paper border border-line rounded-card p-6 shadow-soft space-y-3 flex-grow flex flex-col justify-center">
              <div className="w-10 h-10 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-pine">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-light text-lg text-ink">Selective Onboarding Standard</h4>
              <p className="text-muted text-sm font-light leading-relaxed">
                Rather than deploying standard public interfaces, we maintain premium state-aligned cohorts to satisfy the legal licensing agreements designed directly for our partnered institutions.
              </p>
            </div>

            <div className="bg-paper border border-line rounded-card p-6 shadow-soft space-y-3 flex-grow flex flex-col justify-center">
              <div className="w-10 h-10 rounded-2xl bg-mint/40 border border-line flex items-center justify-center text-moss">
                <Handshake className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-light text-lg text-ink">Direct Compliance Routing</h4>
              <p className="text-muted text-sm font-light leading-relaxed">
                All uploaded student files are routed autonomously through vetted sports agency lawyers and trust administrators to verify NIL licensing pathways are flawless before actual cohort matching.
              </p>
            </div>
          </div>
        </section>

        {/* BRIGHT INTEGRATED REGISTER & PARTNERS ROW */}
        <section id="fc-form-and-partners-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4 text-left">

          {!isSubmitted ? (
            <>
              <div className="lg:col-span-7 bg-paper border border-line rounded-card p-6 sm:p-8 shadow-soft space-y-6">
                <div className="flex items-center gap-3 border-b border-line pb-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 text-pine flex items-center justify-center border border-gold/30">
                    <UserPlus className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-serif font-light text-ink">Future Client Application</h3>
                    <p className="text-muted text-sm font-light">Tell us about yourself and pick the course(s) you&apos;d like to enroll in.</p>
                  </div>
                </div>

                <form onSubmit={handleApplicationSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-sans uppercase text-muted tracking-widest block font-medium">First Name *</label>
                      <input
                        id="application-form-first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Marcus"
                        required
                        disabled={isSubmitting}
                        className="w-full bg-porcelain border border-line rounded-card p-3 text-sm focus:ring-1 focus:ring-pine/40 focus:border-pine focus:outline-none focus:bg-paper transition disabled:opacity-60"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-sans uppercase text-muted tracking-widest block font-medium">Last Name *</label>
                      <input
                        id="application-form-last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Vance"
                        required
                        disabled={isSubmitting}
                        className="w-full bg-porcelain border border-line rounded-card p-3 text-sm focus:ring-1 focus:ring-pine/40 focus:border-pine focus:outline-none focus:bg-paper transition disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-sans uppercase text-muted tracking-widest block font-medium">Email Address *</label>
                    <input
                      id="application-form-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="marcusvance@gmail.com"
                      required
                      disabled={isSubmitting}
                      className="w-full bg-porcelain border border-line rounded-card p-3 text-sm focus:ring-1 focus:ring-pine/40 focus:border-pine focus:outline-none focus:bg-paper transition disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-sans uppercase text-muted tracking-widest block font-medium">Password *</label>
                    <div className="relative">
                      <input
                        id="application-form-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        className="w-full bg-porcelain border border-line rounded-card p-3 pr-11 text-sm focus:ring-1 focus:ring-pine/40 focus:border-pine focus:outline-none focus:bg-paper transition disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        disabled={isSubmitting}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-pine transition disabled:opacity-60"
                        title={showPassword ? 'Hide password' : 'Show password'}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted font-light">This becomes your student portal login once your application is approved.</p>
                  </div>

                  <MultiSelect
                    label="Courses You're Interested In *"
                    placeholder="Select course(s)"
                    searchPlaceholder="Search courses..."
                    options={courseOptions}
                    values={selectedCourseIds}
                    onChange={setSelectedCourseIds}
                    loading={isLoadingCourses}
                    disabled={isSubmitting}
                    emptyLabel="No courses available right now."
                    size="lg"
                  />

                  <div className="p-3 bg-sage/25 border border-line rounded-card flex items-start gap-2.5 text-xs text-muted leading-relaxed font-light">
                    <ShieldAlert className="w-4 h-4 text-pine mt-0.5 shrink-0" />
                    <span>
                      By submitting this application, you authorize TrueTrek Learning to review your information for admission. Your student account is created only once an administrator approves your application.
                    </span>
                  </div>

                  <button
                    id="btn-submit-application"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-pine hover:bg-moss disabled:opacity-60 disabled:cursor-not-allowed text-paper font-sans font-semibold text-sm uppercase tracking-wider py-4 px-4 rounded-full transition duration-150 flex items-center justify-center gap-2 shadow-soft mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" /> Submit Application
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Side: Elite Partners showcase */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-3 border-b border-line pb-3">
                  <div className="w-10 h-10 rounded-xl bg-mint/40 text-pine flex items-center justify-center border border-line">
                    <Handshake className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-light text-ink">Sanctioned Affiliations</h3>
                    <p className="text-muted text-sm font-light">Direct legal integrations and secure brand match paths.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {COMPANY_PARTNERS.map((partner) => (
                    <div
                      id={`partner-row-${partner.id}`}
                      key={partner.id}
                      className="bg-paper border border-line p-5 rounded-card shadow-soft flex flex-col justify-between hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 space-y-2 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-gold text-[10px] font-sans uppercase font-medium tracking-widest">{partner.badge}</span>
                          <h4 className="text-sm font-serif font-light text-ink leading-tight">{partner.name}</h4>
                          <p className="text-[11px] text-muted font-semibold">{partner.role}</p>
                        </div>
                        <span className="bg-sage/40 text-moss border border-line text-[9px] uppercase tracking-wider font-sans px-1.5 py-0.5 rounded shrink-0 font-medium">
                          {partner.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted font-light leading-relaxed pt-1.5 border-t border-line">
                        {partner.desc}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-muted font-sans pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-muted" />
                          {partner.location}
                        </span>
                        <span className="text-moss font-bold">✓ Direct Sync</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          ) : (
            <div className="lg:col-span-12 bg-sage/30 border border-line rounded-card p-8 sm:p-10 shadow-soft text-center space-y-6 max-w-2xl mx-auto">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-paper text-moss flex items-center justify-center border border-line">
                <CheckCircle className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-serif font-light text-ink">Application Received</h3>
                <p className="text-muted text-sm font-light leading-relaxed">
                  Thanks{submittedApplication?.first_name ? `, ${submittedApplication.first_name}` : ''} — your application is now pending review. We&apos;ll reach out at{' '}
                  <span className="font-medium text-ink">{submittedApplication?.email}</span> once an administrator has reviewed it.
                </p>
              </div>

              {submittedApplication?.courses?.length > 0 && (
                <div className="text-left bg-paper border border-line rounded-card p-5 space-y-2">
                  <p className="text-xs font-sans uppercase text-muted tracking-widest font-medium">Requested Courses</p>
                  {submittedApplication.courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">{course.title}</span>
                      <span className="font-sans text-muted">${course.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                id="btn-reset-application"
                type="button"
                onClick={handleResetApplication}
                className="bg-paper hover:bg-porcelain border border-line text-pine font-sans font-semibold text-sm py-3.5 px-6 rounded-full transition shadow-soft"
              >
                Submit Another Application
              </button>
            </div>
          )}

        </section>

        {/* SECTION: PREVIOUS CUSTOMERS FEEDBACK */}
        <section id="fc-feedback-section" className="space-y-6 pt-4 text-left">
          <div className="border-b border-line pb-4">
            <span className="text-gold font-sans text-xs uppercase tracking-widest font-medium">ALUMNI REFLECTIONS</span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
              <div>
                <h3 className="text-2xl font-serif font-light text-ink tracking-tight">Previous Customers &amp; Feedback</h3>
                <p className="text-muted text-sm font-light">Real athletic portfolios, family advisors, and academic councils tracking outstanding outcomes.</p>
              </div>
              <div className="flex items-center gap-1 bg-paper border border-line px-3 py-1.5 rounded-full font-sans text-sm text-ink">
                <span className="w-2 h-2 rounded-full bg-moss shrink-0" />
                <span className="font-bold">100% Client Satisfaction</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PREVIOUS_FEEDBACK.map((feedback, index) => (
              <div
                id={`feedback-card-${feedback.id}`}
                key={feedback.id}
                className="bg-paper border border-line p-6 rounded-card flex flex-col justify-between shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 relative group text-left"
              >
                {/* Visual quote icon ornament */}
                <div className="absolute right-4 top-4 text-porcelain group-hover:text-gold/20 transition-colors pointer-events-none">
                  <Quote className="w-10 h-10 stroke-[3]" />
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Stars Rating */}
                  <div className="flex gap-1">
                    {[...Array(feedback.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                    ))}
                  </div>

                  {/* Testimonial Quote */}
                  <blockquote className="text-xs sm:text-sm text-muted font-light italic leading-relaxed py-1">
                    &ldquo;{feedback.quote}&rdquo;
                  </blockquote>
                </div>

                {/* Writer Identity Details */}
                <div className="flex items-center gap-3.5 border-t border-line pt-4 mt-4 relative z-10">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]} text-paper flex items-center justify-center font-serif font-medium text-sm shadow-soft shrink-0`}>
                    {feedback.avatarText}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center justify-between gap-1">
                      <cite className="not-italic text-sm font-serif font-light text-ink truncate block">
                        {feedback.name}
                      </cite>
                    </div>
                    <span className="text-[11px] text-pine font-sans font-medium block truncate">
                      {feedback.role}
                    </span>
                    <span className="text-[10px] text-muted font-sans block uppercase tracking-wider">
                      {feedback.school} &bull; {feedback.sport}
                    </span>
                  </div>
                </div>

                <div className="absolute top-3 left-4 bg-gold/15 border border-gold/30 font-sans text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded text-pine scale-0 group-hover:scale-100 duration-150 transform transition">
                  {feedback.verifiedBadge}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
