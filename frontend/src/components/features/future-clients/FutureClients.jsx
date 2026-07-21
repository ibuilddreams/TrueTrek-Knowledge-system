"use client";

import React, { useState } from 'react';
import { 
  UserPlus, CheckCircle, ShieldAlert, Sparkles, Star, MapPin, 
  Handshake, Trophy, Award, Landmark, ShieldCheck, Quote, BookOpen,
  Upload, Image as ImageIcon, X, Camera,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectIntake,
  setIntakeSubmitted,
  setIntakeData,
  setPerformanceImages as setPerformanceImagesAction,
  clearIntake,
} from '@/store/slices/intake/intakeSlice';

export default function FutureClients() {
  // Local states for Intake form
  const [intakeName, setIntakeName] = useState('');
  const [intakeEmail, setIntakeEmail] = useState('');
  const [intakeSport, setIntakeSport] = useState('Football');
  const [intakeDivision, setIntakeDivision] = useState('D1');
  const [intakeSchool, setIntakeSchool] = useState('');
  const [intakeGradYear, setIntakeGradYear] = useState('2027');
  const [intakeState, setIntakeState] = useState('');
  const dispatch = useDispatch();
  const intake = useSelector(selectIntake);
  const isIntakeSubmitted = intake.isSubmitted;
  const setIsIntakeSubmitted = (value) => dispatch(setIntakeSubmitted(value));
  const submittedIntakeData = intake.intakeData;
  const setSubmittedIntakeData = (value) => dispatch(setIntakeData(value));
  const performanceImages = intake.performanceImages;
  const setPerformanceImages = (value) => {
    const next = typeof value === 'function' ? value(performanceImages) : value;
    dispatch(setPerformanceImagesAction(next));
  };
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const PRESET_IMAGES = [
    { id: 'football', label: '🏈 Game Day QB', url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&q=80&w=600', caption: 'State Semifinals Touchdown Game Shot' },
    { id: 'track', label: '⚡ Sprinting Block', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=600', caption: 'Starting Blocks Focus (100m Dash)' },
    { id: 'basketball', label: '🏀 Slam Dunk Drive', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600', caption: 'Overhead Drive Challenge & Slam Dunk' },
    { id: 'swimming', label: '🏊 Water Butterfly', url: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&q=80&w=600', caption: 'Butterfly Stroke Clearance Splashes' },
    { id: 'training', label: '🏋️ High-Intensity Gym', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=605', caption: 'Strength Conditioning & Physical Bench Prep' }
  ];

  const handleImageFileChange = (e) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((item) => {
      const file = item ;
      if (!file.type.startsWith('image/')) return;
      
      // Limit upload size to ~1.2 MB for in-memory Redux session state
      if (file.size > 1.2 * 1024 * 1024) {
        alert('File is too large. Please select an image smaller than 1.2MB for local memory storage.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg = {
            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: event.target.result ,
            caption: file.name.substring(0, file.name.lastIndexOf('.')) || 'Performance Photo'
          };
          setPerformanceImages((prev) => {
            const updated = [...prev, newImg];

            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files) return;

    Array.from(files).forEach((item) => {
      const file = item ;
      if (!file.type.startsWith('image/')) return;
      
      if (file.size > 1.2 * 1024 * 1024) {
        alert('File is too large. Please select an image smaller than 1.2MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg = {
            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: event.target.result ,
            caption: file.name.substring(0, file.name.lastIndexOf('.')) || 'Performance Photo'
          };
          setPerformanceImages((prev) => {
            const updated = [...prev, newImg];

            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const addPresetImage = (preset) => {
    if (performanceImages.some((img) => img.url === preset.url)) {
      return;
    }
    const newImg = {
      id: `preset-${preset.id}-${Date.now()}`,
      url: preset.url,
      caption: preset.caption,
      isPreset: true
    };
    setPerformanceImages((prev) => {
      const updated = [...prev, newImg];

      return updated;
    });
  };

  const removeImage = (id) => {
    setPerformanceImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);

      return updated;
    });
    if (selectedImageIndex >= Math.max(1, performanceImages.length - 1)) {
      setSelectedImageIndex(0);
    }
  };

  const updateCaption = (id, newCaption) => {
    setPerformanceImages((prev) => {
      const updated = prev.map((img) => img.id === id ? { ...img, caption: newCaption } : img);

      return updated;
    });
  };

  const handleIntakeSubmit = (e) => {
    e.preventDefault();
    if (!intakeName || !intakeEmail || !intakeSchool) return;

    const data = {
      name: intakeName,
      email: intakeEmail,
      sport: intakeSport,
      division: intakeDivision,
      school: intakeSchool,
      gradYear: intakeGradYear,
      state: intakeState || 'N/A',
      submittedAt: new Date().toLocaleDateString()
    };

    setSubmittedIntakeData(data);
    setIsIntakeSubmitted(true);


    confetti({
      particleCount: 120,
      spread: 80,
      colors: ['#d97706', '#fbbf24', '#1c1917']
    });
  };

  const handleResetIntake = () => {
    dispatch(clearIntake());
    setSelectedImageIndex(0);
    setIntakeName('');
    setIntakeEmail('');
    setIntakeSchool('');
    setIntakeState('');
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
    <div id="future-clients-root" className="min-h-screen bg-[#faf9f6] py-12 px-4 sm:px-6 lg:px-8 text-stone-900 leading-normal">
      
      {/* Decorative background grid pattern */}
      <div className="absolute inset-x-0 top-20 h-96 bg-gradient-to-b from-[#f3f1eb]/50 to-transparent pointer-events-none -z-10" />

      <div id="future-clients-container" className="max-w-6xl mx-auto space-y-16">
        
        {/* HERO BANNER SECTION */}
        <header id="fc-hero-section" className="text-center space-y-4 max-w-3xl mx-auto pt-4 animate-fade-in text-left sm:text-center">
          <div className="inline-flex items-center gap-1.5 bg-amber-150/60 border border-amber-300 px-3 py-1 rounded-full text-amber-850 text-[10px] font-mono uppercase tracking-widest font-semibold mx-auto sm:mx-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            Elite Student-Athlete Placement Hub
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-950 leading-none">
            Relational Onboarding &amp; On-Queue Placement
          </h2>
          <p className="text-stone-550 text-sm sm:text-base font-light leading-relaxed">
            Register your active recruiting dossier to evaluate potential platform membership, compliance clearances, and 11-Tier academic integration. Selected prospects obtain secure access keys to our flagship NIL simulations.
          </p>
        </header>

        {/* SECTION: ABOUT FUTURE CLIENTS & PLATFORM VALUE PROPOSITION */}
        <section id="fc-about-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2 text-left">
          <div className="lg:col-span-7 bg-stone-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-stone-850 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-24 -top-24 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-6 relative z-10">
              <span className="text-amber-500 font-mono text-[10px] uppercase tracking-widest font-bold">PORTFOLIO PLACEMENT PATHWAYS</span>
              <h3 className="text-2xl sm:text-3xl font-serif font-black tracking-tight leading-snug">
                Why Submit Credentials For TrueTrek Learning Evaluation?
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed">
                TrueTrek Learning represents the premier administrative and legal compliance portal for selective high-performance scholar-athletes. Because platform placement is protected by strict scholastic quotas and regional compliance caps, we require prospective student-athletes to submit formal intake dossiers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-stone-800/80">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider">FERPA-SAFE DATA LOCKS</span>
                  </div>
                  <p className="text-stone-400 text-[11px] font-light leading-normal">
                    Secure scholastic clearinghouse processes protect collegiate admissions standing and high-school eligibility.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider font-semibold">11-TIER TRANSITION AUDIT</span>
                  </div>
                  <p className="text-stone-400 text-[11px] font-light leading-normal">
                    Successful intakes receive a complete diagnostic report reviewing the high-integrity framework pathways.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-stone-400 relative z-10">
              <span className="flex items-center gap-1.5 font-bold">
                <Trophy className="w-4 h-4 text-amber-500" /> 1600+ Scholars Placed
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <Landmark className="w-4 h-4 text-amber-500" /> NCAA Tier-1 Certified
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div className="bg-white border border-stone-250/60 rounded-3xl p-6 shadow-sm space-y-3 flex-grow flex flex-col justify-center">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-black text-lg text-stone-900">Selective Onboarding Standard</h4>
              <p className="text-stone-500 text-xs font-light leading-relaxed">
                Rather than deploying standard public interfaces, we maintain premium state-aligned cohorts to satisfy the legal licensing agreements designed directly for our partnered institutions.
              </p>
            </div>

            <div className="bg-white border border-stone-250/60 rounded-3xl p-6 shadow-sm space-y-3 flex-grow flex flex-col justify-center">
              <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-250 flex items-center justify-center text-stone-700">
                <Handshake className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-black text-lg text-stone-900">Direct Compliance Routing</h4>
              <p className="text-stone-500 text-xs font-light leading-relaxed">
                All uploaded student files are routed autonomously through vetted sports agency lawyers and trust administrators to verify NIL licensing pathways are flawless before actual cohort matching.
              </p>
            </div>
          </div>
        </section>

        {/* BRIGHT INTEGRATED REGISTER & PARTNERS ROW */}
        <section id="fc-form-and-partners-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4 text-left">

          {!isIntakeSubmitted ? (
            <>
              <div className="lg:col-span-7 bg-white border border-stone-250/70 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                    <UserPlus className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-serif font-black text-stone-900">Prospect Intake Questionnaire</h3>
                    <p className="text-stone-500 text-xs font-light">Submit scholastic dossier to join our select administrative review queue.</p>
                  </div>
                </div>

                <form onSubmit={handleIntakeSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-stone-450 tracking-wider block font-bold">Full Legal Name *</label>
                      <input 
                        id="intake-form-name"
                        type="text"
                        value={intakeName}
                        onChange={(e) => setIntakeName(e.target.value)}
                        placeholder="Marcus Vance Jr."
                        required
                        className="w-full bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:bg-white transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-stone-455 tracking-wider block font-bold">Email Address *</label>
                      <input 
                        id="intake-form-email"
                        type="email"
                        value={intakeEmail}
                        onChange={(e) => setIntakeEmail(e.target.value)}
                        placeholder="marcusvance@gmail.com"
                        required
                        className="w-full bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-stone-455 tracking-wider block font-bold">Primary Sport</label>
                      <select 
                        id="intake-form-sport"
                        value={intakeSport}
                        onChange={(e) => setIntakeSport(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:bg-white transition"
                      >
                        <option value="Football">Football</option>
                        <option value="Basketball">Basketball</option>
                        <option value="Track & Field">Track & Field</option>
                        <option value="Swimming">Swimming</option>
                        <option value="Gymnastics">Gymnastics</option>
                        <option value="Soccer">Soccer</option>
                        <option value="Baseball">Baseball</option>
                        <option value="Volleyball">Volleyball</option>
                        <option value="Golf">Golf</option>
                        <option value="Tennis">Tennis</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-stone-455 tracking-wider block font-bold">NCAA Division Eligibility</label>
                      <select 
                        id="intake-form-division"
                        value={intakeDivision}
                        onChange={(e) => setIntakeDivision(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:bg-white transition"
                      >
                        <option value="D1">NCAA Division I</option>
                        <option value="D2">NCAA Division II</option>
                        <option value="D3">NCAA Division III</option>
                        <option value="NAIA">NAIA Level</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-stone-455 tracking-wider block font-bold">Affiliated Institution (High School/University) *</label>
                    <input 
                      id="intake-form-school"
                      type="text"
                      value={intakeSchool}
                      onChange={(e) => setIntakeSchool(e.target.value)}
                      placeholder="University of Oregon"
                      required
                      className="w-full bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:bg-white transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-stone-455 tracking-wider block font-bold">Expected Graduation Year</label>
                      <select 
                        id="intake-form-grad"
                        value={intakeGradYear}
                        onChange={(e) => setIntakeGradYear(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:bg-white transition"
                      >
                        <option value="2025">Class of 2025</option>
                        <option value="2026">Class of 2026</option>
                        <option value="2027">Class of 2027</option>
                        <option value="2028">Class of 2028</option>
                        <option value="2029">Class of 2029</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-stone-455 tracking-wider block font-bold">Home State / Region Location</label>
                      <input 
                        id="intake-form-state"
                        type="text"
                        value={intakeState}
                        onChange={(e) => setIntakeState(e.target.value)}
                        placeholder="Oregon (OR)"
                        className="w-full bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* ATHLETIC PERFORMANCE PICTURES FILES UPLOADER */}
                  <div className="space-y-3.5 pt-4 border-t border-stone-100">
                    <div className="flex items-center gap-1.5 text-stone-900">
                      <ImageIcon className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-[10px] font-mono uppercase text-stone-950 tracking-wider font-bold">
                        Athletic Performance Media Portfolio (Optional)
                      </span>
                    </div>
                    <p className="text-stone-500 text-[11px] font-light leading-relaxed">
                      Upload your high-performance game actions, certificates, media portraits, or test immediately using professional action presets!
                    </p>
                    
                    {/* File Dropzone */}
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition relative flex flex-col items-center justify-center cursor-pointer ${
                        isDragging 
                          ? 'border-amber-500 bg-amber-50/40' 
                          : 'border-stone-200 bg-stone-50 hover:bg-stone-50/50'
                      }`}
                    >
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Upload className="w-7 h-7 text-stone-400 mb-2" />
                      <p className="text-[11px] font-semibold text-stone-700">
                        Drag &amp; drop action files here, or <span className="text-amber-700 font-bold underline">browse local drive</span>
                      </p>
                      <p className="text-[9px] text-stone-400 mt-0.5 font-light">Supports JPG, PNG, WEBP &bull; Limit size to 1.2MB for custom high resolution</p>
                    </div>

                    {/* Presets Grid */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">Quick Sample Actions to Augment:</p>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_IMAGES.map((preset) => {
                          const isAlreadyAdded = performanceImages.some((img) => img.url === preset.url);
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => addPresetImage(preset)}
                              disabled={isAlreadyAdded}
                              className={`text-[10px] px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                                isAlreadyAdded 
                                  ? 'bg-amber-50/50 border-amber-250 text-amber-800 font-mono font-bold opacity-60 cursor-not-allowed' 
                                  : 'bg-white border-stone-200 hover:border-stone-350 text-stone-700 font-medium'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Image thumbnails review gallery list */}
                    {performanceImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        {performanceImages.map((img, idx) => (
                          <div key={img.id} className="relative rounded-xl border border-stone-200 bg-white p-2 flex flex-col space-y-1 text-left">
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-stone-100 shrink-0">
                              <img 
                                src={img.url} 
                                alt={img.caption} 
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                className="absolute top-1 right-1 p-1 bg-stone-900/80 text-white rounded-full hover:bg-red-650 transition z-20"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <span className="absolute bottom-1 left-1 bg-stone-900/70 text-stone-100 text-[8px] px-1 rounded font-mono">
                                Photo #{idx + 1}
                              </span>
                            </div>
                            
                            <input
                              type="text"
                              value={img.caption}
                              onChange={(e) => updateCaption(img.id, e.target.value)}
                              placeholder="Photo label/caption..."
                              className="w-full bg-stone-50 border border-stone-200 rounded p-1 text-[10px] text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-light mt-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-amber-50/40 border border-amber-200/40 rounded-xl flex items-start gap-2.5 text-[11px] text-stone-605 leading-relaxed font-light">
                    <ShieldAlert className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <span>
                      By submitting this regulatory profile, you authorize TrueTrek Learning LLC to catalog your data, generating an automated clearance token. Your records are confidential and used solely for cohort matching.
                    </span>
                  </div>

                  <button
                    id="btn-submit-intake"
                    type="submit"
                    className="w-full bg-stone-950 hover:bg-stone-850 text-white font-serif font-bold text-xs uppercase tracking-wider py-4 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-md mt-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Submit Prospect Dossier
                  </button>
                </form>
              </div>

              {/* Right Side: Elite Partners showcase */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center border border-orange-200">
                    <Handshake className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-black text-stone-900">Sanctioned Affiliations</h3>
                    <p className="text-stone-500 text-xs font-light">Direct legal integrations and secure brand match paths.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {COMPANY_PARTNERS.map((partner) => (
                    <div 
                      id={`partner-row-${partner.id}`}
                      key={partner.id} 
                      className="bg-white border border-stone-200 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition space-y-2 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-amber-800 text-[9px] font-mono uppercase font-bold tracking-widest">{partner.badge}</span>
                          <h4 className="text-xs font-serif font-black text-stone-900 leading-tight">{partner.name}</h4>
                          <p className="text-[10px] text-stone-500 font-semibold">{partner.role}</p>
                        </div>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[8px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded shrink-0 font-bold">
                          {partner.status}
                        </span>
                      </div>

                      <p className="text-[10px] text-stone-600 font-light leading-relaxed pt-1.5 border-t border-stone-100">
                        {partner.desc}
                      </p>

                      <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-stone-400" />
                          {partner.location}
                        </span>
                        <span className="text-emerald-700 font-bold">✓ Direct Sync</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          ) : (
            <>
              <div className="lg:col-span-5 bg-white border border-stone-250 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-250">
                      <ShieldCheck className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-serif font-black text-stone-900">Evaluation Receipt</h3>
                      <p className="text-stone-450 text-[11px] font-light font-sans">Official clearinghouse status ledger.</p>
                    </div>
                  </div>

                  <div className="p-5 bg-emerald-50/25 border border-emerald-200 rounded-2xl space-y-4 text-xs text-stone-700 mt-4">
                    <div className="flex items-center gap-2 text-emerald-850 font-bold">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="font-mono text-[9px] uppercase tracking-widest block font-bold">DOSSIER RECEIVED &amp; QUEUED</span>
                    </div>

                    <div className="border-t border-dashed border-emerald-200/60 pt-4 space-y-3.5">
                      <div>
                        <p className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider">ATHLETE FULL NAME</p>
                        <p className="font-serif font-black text-stone-905 text-sm">{submittedIntakeData?.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider">SPORT &amp; LEVEL</p>
                          <p className="font-bold text-stone-800">{submittedIntakeData?.sport} ({submittedIntakeData?.division})</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider">INSTITUTION</p>
                          <p className="font-semibold text-stone-805 truncate block">{submittedIntakeData?.school}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-mono text-stone-450 font-semibold uppercase tracking-wider">GRADUATION EXPECTANCY</p>
                          <p className="font-serif font-black text-amber-800">Class of {submittedIntakeData?.gradYear}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-mono text-stone-450 font-semibold uppercase tracking-wider">REGIONAL JURISDICTION</p>
                          <p className="font-semibold text-stone-800">{submittedIntakeData?.state}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-950 text-stone-200 rounded-xl font-mono text-[9px] flex flex-col gap-1 mt-1 leading-normal">
                      <span className="truncate block">KEY REF: PROSPECT-{submittedIntakeData?.name?.toUpperCase().slice(0, 3)}-{submittedIntakeData?.gradYear}</span>
                      <span className="text-emerald-500 font-bold flex items-center gap-1 shrink-0">
                        ● ONLINE CLEARANCE SECURED
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex flex-col gap-2">
                  <button
                    id="btn-reset-intake"
                    onClick={handleResetIntake}
                    className="w-full bg-white hover:bg-stone-50 border border-stone-250 text-stone-750 font-serif font-bold text-xs py-3.5 px-4 rounded-xl transition shadow-xs"
                  >
                    Reset &amp; Submit Different Dossier
                  </button>
                </div>
              </div>

              {/* Verified Prospect Scout Portfolio Gallery Card On Right Side */}
              <div className="lg:col-span-7 bg-stone-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-850 relative overflow-hidden flex flex-col space-y-6">
                <div className="absolute -right-24 -top-24 w-60 h-60 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-900 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 overflow-hidden flex items-center justify-center shrink-0">
                      {performanceImages.length > 0 ? (
                        <img 
                          src={performanceImages[0].url} 
                          alt="Athlete Primary Headshot" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest block font-bold">VERIFIED EVALUATION PROFILE</span>
                      <h4 className="text-lg font-serif font-black tracking-tight">{submittedIntakeData?.name}</h4>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-stone-400 truncate block max-w-[150px]">{submittedIntakeData?.school}</span>
                        <span className="w-1 h-1 rounded-full bg-stone-700" />
                        <span className="text-amber-400 font-bold font-mono uppercase tracking-wide">{submittedIntakeData?.sport}</span>
                      </div>
                    </div>
                  </div>
                  {/* Rating */}
                  <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span className="font-mono text-[11px] font-black text-amber-400">4.9 Star Prospect</span>
                  </div>
                </div>

                {/* Score indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 text-left relative z-10">
                  <div className="bg-stone-900/60 border border-stone-850 p-3 rounded-2xl">
                    <span className="text-[9px] font-mono text-stone-450 uppercase tracking-wider block font-bold">NIL Potential</span>
                    <span className="font-serif font-black text-amber-500 text-sm mt-0.5 block leading-none">Tier-1 Elite</span>
                  </div>
                  <div className="bg-stone-900/60 border border-stone-850 p-3 rounded-2xl">
                    <span className="text-[9px] font-mono text-stone-455 uppercase tracking-wider block font-bold">Recruit Rank</span>
                    <span className="font-mono font-bold text-white text-sm mt-0.5 block leading-none">Top 95%</span>
                  </div>
                  <div className="bg-stone-900/60 border border-stone-850 p-3 rounded-2xl">
                    <span className="text-[9px] font-mono text-stone-455 uppercase tracking-wider block font-bold">National Seed</span>
                    <span className="font-serif font-bold text-white text-sm mt-0.5 block leading-none">
                      #{submittedIntakeData?.gradYear === '2025' ? '41' : submittedIntakeData?.gradYear === '2026' ? '18' : '12'}
                    </span>
                  </div>
                  <div className="bg-stone-900/60 border border-stone-850 p-3 rounded-2xl">
                    <span className="text-[9px] font-mono text-stone-455 uppercase tracking-wider block font-bold">Clearance</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs mt-1 block leading-none">APPROVED</span>
                  </div>
                </div>

                {/* Picture Gallery Carousel Viewer */}
                <div className="space-y-3.5 text-left relative z-10">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold flex items-center gap-1.5 pt-1">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    REGISTERED ATHLETIC MEDIA ({performanceImages.length} asset{performanceImages.length === 1 ? '' : 's'})
                  </span>

                  {performanceImages.length > 0 ? (
                    <div className="space-y-3">
                      {/* Active Preview Frame */}
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-900 border border-stone-850">
                        <img 
                          src={performanceImages[selectedImageIndex].url} 
                          alt={performanceImages[selectedImageIndex].caption} 
                          className="w-full h-full object-cover transition-all duration-350"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent p-4 flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-end text-xs">
                          <span className="text-stone-100 font-serif font-black drop-shadow-md text-xs sm:text-sm">
                            {performanceImages[selectedImageIndex].caption}
                          </span>
                          <span className="bg-stone-900/90 text-amber-400 font-mono text-[9px] px-2 py-1 rounded-lg border border-stone-800 shrink-0 self-start sm:self-auto">
                            Image {selectedImageIndex + 1} of {performanceImages.length}
                          </span>
                        </div>
                      </div>

                      {/* Selector dots/thumbnails list */}
                      <div className="flex gap-2 overflow-x-auto pb-1 select-none">
                        {performanceImages.map((img, idx) => (
                          <button
                            key={img.id}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`relative aspect-video w-16 rounded-lg overflow-hidden border transition duration-150 shrink-0 ${
                              selectedImageIndex === idx 
                                ? 'border-amber-500 ring-2 ring-amber-500/20 opacity-100 scale-95' 
                                : 'border-stone-850 opacity-55 hover:opacity-100'
                            }`}
                          >
                            <img 
                              src={img.url} 
                              alt="thumbnail" 
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-stone-900/60 border border-dashed border-stone-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-2.5">
                      <Camera className="w-8 h-8 text-stone-600" />
                      <h4 className="text-xs font-bold text-stone-300">No Image Evidence Added</h4>
                      <p className="text-[11px] text-stone-500 max-w-sm leading-relaxed">
                        Add action photos, workout videos stills, or clearance files in the intake form preview to craft an immersive high-affinity scout scorecard.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer disclaimer */}
                <div className="p-3.5 bg-[#141210] border border-stone-900 rounded-2xl flex items-start gap-3 text-[11px] text-stone-400 font-light mt-auto">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-left text-stone-400">
                    This compliance scoresheet details secure NIL values and academic clearing indicators. It is protected under FERPA academic privacy and shareable directly with strategic Mastermind agents.
                  </p>
                </div>

              </div>

            </>
          )}

        </section>

        {/* SECTION: PREVIOUS CUSTOMERS FEEDBACK */}
        <section id="fc-feedback-section" className="space-y-6 pt-4 text-left">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-amber-700 font-mono text-[10px] uppercase tracking-widest font-bold">ALUMNI REFLECTIONS</span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
              <div>
                <h3 className="text-2xl font-serif font-black text-stone-950 tracking-tight">Previous Customers &amp; Feedback</h3>
                <p className="text-stone-500 text-xs font-light">Real athletic portfolios, family advisors, and academic councils tracking outstanding outcomes.</p>
              </div>
              <div className="flex items-center gap-1 bg-white border border-stone-200 px-3 py-1.5 rounded-xl font-mono text-xs text-stone-750">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold">100% Client Satisfaction</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PREVIOUS_FEEDBACK.map((feedback) => (
              <div 
                id={`feedback-card-${feedback.id}`}
                key={feedback.id} 
                className="bg-white border border-stone-250/70 p-6 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition duration-200 relative group text-left"
              >
                {/* Visual quote icon ornament */}
                <div className="absolute right-4 top-4 text-stone-100 group-hover:text-amber-500/10 transition-colors pointer-events-none">
                  <Quote className="w-10 h-10 stroke-[3]" />
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Stars Rating */}
                  <div className="flex gap-1">
                    {[...Array(feedback.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>

                  {/* Testimonial Quote */}
                  <blockquote className="text-[11.5px] sm:text-xs text-stone-600 font-light italic leading-relaxed py-1">
                    &ldquo;{feedback.quote}&rdquo;
                  </blockquote>
                </div>

                {/* Writer Identity Details */}
                <div className="flex items-center gap-3.5 border-t border-stone-100 pt-4 mt-4 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-serif font-bold text-xs shadow-sm shadow-amber-900/10 shrink-0">
                    {feedback.avatarText}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center justify-between gap-1">
                      <cite className="not-italic text-xs font-serif font-black text-stone-900 truncate block">
                        {feedback.name}
                      </cite>
                    </div>
                    <span className="text-[10px] text-amber-900 font-mono font-medium block truncate">
                      {feedback.role}
                    </span>
                    <span className="text-[9px] text-stone-400 font-mono block uppercase tracking-wider block">
                      {feedback.school} &bull; {feedback.sport}
                    </span>
                  </div>
                </div>

                <div className="absolute top-3 left-4 bg-amber-50 border border-amber-200/60 font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded text-amber-850 scale-0 group-hover:scale-100 duration-150 transform transition">
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