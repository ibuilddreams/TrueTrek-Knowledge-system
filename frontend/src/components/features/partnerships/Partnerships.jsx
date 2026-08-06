"use client";

import { useState, useMemo } from 'react';
import { Landmark, Calculator, Users, Shield, Percent, HeartPulse } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';

export default function Partnerships() {
  const [studentCount, setStudentCount] = useState(500);
  const [licenceTier, setLicenceTier] = useState('platinum');
  const [counselorDensity, setCounselorDensity] = useState(200); // 1 counselor per X students

  // Calculate simulated pricing & impact statistics based on configurations
  const simulatorMetrics = useMemo(() => {
    let baseRate = 0;
    let multiplier = 1.0;
    let coverageText = '';

    if (licenceTier === 'gold') {
      baseRate = 12; // $12 per year per student
      multiplier = 0.95;
      coverageText = 'Includes standard core modules (Tiers 1-4) covering athletic & scholastic readiness, without custom branding.';
    } else if (licenceTier === 'platinum') {
      baseRate = 22; // $22 per year per student
      multiplier = 1.15;
      coverageText = 'Full access to Tiers 1-8. Features institutional dashboard overlays, custom colors, and compliance alerts.';
    } else { // legacy
      baseRate = 38; // $38 per year per student
      multiplier = 1.45;
      coverageText = 'Unlimited 11-Tier portfolio access including Trust Offices guidance (Tier 9), and active advisory webinars.';
    }

    // Calculate licensing fee
    const annualLicensing = Math.round(studentCount * baseRate * (counselorDensity < 150 ? 1.08 : 0.95));
    
    // Compliance evaluation score (simulated)
    const complianceScore = Math.min(99, Math.round(75 + (50 * (150 / counselorDensity)) + (licenceTier === 'legacy' ? 12 : 5)));
    
    // Mental health risk mitigation metric (simulated)
    const riskReduction = Math.min(88, Math.round(45 + (30 * (180 / counselorDensity)) + (licenceTier === 'platinum' ? 8 : 12)));

    return {
      annualLicensing: annualLicensing.toLocaleString('en-US'),
      complianceScore,
      riskReduction,
      coverageText
    };
  }, [studentCount, licenceTier, counselorDensity]);

  return (
    <div id="partnerships-container" className="bg-[#faf9f6] py-16 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Editorial Subtitle Block */}
        <SectionHeading
          className="mb-16"
          eyebrow="Enterprise Licensing Portal"
          eyebrowClassName="text-amber-800"
          heading="Institutional Masterclass Covenants"
          headingClassName="text-4xl md:text-5xl font-serif text-stone-900 font-bold tracking-tight"
          subtitle="We license the complete TrueTrek Learning digital framework to selective High Schools, Collegiate Leagues, and Regional Sports Academies to reduce institutional liability and maximize student-athlete success."
          subtitleClassName="text-stone-600 text-sm max-w-2xl mx-auto font-light leading-relaxed"
        />

        {/* Benefits Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white border border-stone-200/80 p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center mb-5 border border-orange-100">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-stone-900 mb-2">Institutional White-Labeling</h3>
            <p className="text-stone-600 text-xs leading-relaxed font-light">
              Transform the student dashboard to display custom school insignias, athletic colors, and counselor communications with full FERPA/COPPA student privacy regulation compliance.
            </p>
          </div>

          <div className="bg-white border border-stone-200/80 p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 border border-emerald-100">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-stone-900 mb-2">Real-time Safety Indicators</h3>
            <p className="text-stone-600 text-xs leading-relaxed font-light">
              Identify cognitive fatigue, burnout triggers, and chronic low performance early. Safe, anonymized counselor escalation guidelines guarantee psychological continuity.
            </p>
          </div>

          <div className="bg-white border border-stone-200/80 p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5 border border-blue-100">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-stone-900 mb-2">Athletic & Scholastic Shield</h3>
            <p className="text-stone-600 text-xs leading-relaxed font-light">
              Protect your sports program from NCAA sanctions, NIL contract compliance blocks, and financial governance risks. Includes pre-audited template covenants.
            </p>
          </div>
        </div>

        {/* Smart Administrative Cost & KPI Simulator Overlay */}
        <div className="bg-stone-900 text-white rounded-3xl p-6 md:p-10 border border-stone-800 shadow-xl overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 w-96 h-96 rounded-full bg-amber-600/5 blur-[100px] pointer-events-none"></div>

          <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-stone-800 pb-5">
            <Calculator className="text-amber-500 w-5 h-5" />
            <h3 className="text-xl md:text-2xl font-serif font-semibold text-stone-100">
              Annual License Cost & Impact KPI Simulator
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Interactive Side: Controls */}
            <div id="sim-controls" className="lg:col-span-7 space-y-8">
              
              {/* Sliders for Student Pool */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-mono text-stone-400 uppercase tracking-widest">Student Body Count</label>
                  <span className="text-amber-500 font-mono text-sm font-bold">{studentCount} Students</span>
                </div>
                <input
                  id="range-student-count"
                  type="range"
                  min="50"
                  max="3000"
                  step="50"
                  value={studentCount}
                  onChange={(e) => setStudentCount(parseInt(e.target.value))}
                  className="w-full accent-amber-500 bg-stone-800 h-1 rounded"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono mt-1">
                  <span>50</span>
                  <span>1,500</span>
                  <span>3,000 students</span>
                </div>
              </div>

              {/* Tier Selection Radio Tiles */}
              <div>
                <label className="text-xs font-mono text-stone-400 uppercase tracking-widest block mb-3">Licensing Level</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'gold', title: 'Gold (Tiers 1-4)', price: '$12/stud' },
                    { id: 'platinum', title: 'Platinum (Tiers 1-8)', price: '$22/stud' },
                    { id: 'legacy', title: 'Legacy (Tiers 1-11)', price: '$38/stud' }
                  ].map((tier) => (
                    <button
                      id={`licence-tier-btn-${tier.id}`}
                      key={tier.id}
                      onClick={() => setLicenceTier(tier.id )}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        licenceTier === tier.id
                          ? 'bg-amber-600/10 border-amber-500 text-white'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-850'
                      }`}
                    >
                      <p className="text-xs font-semibold text-stone-250">{tier.title}</p>
                      <p className="text-[10px] font-mono mt-1 text-amber-500">{tier.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders for Counseling Density */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-mono text-stone-400 uppercase tracking-widest">Counseling Ratio Density</label>
                  <span className="text-amber-500 font-mono text-sm font-bold">1 counselor : {counselorDensity} students</span>
                </div>
                <input
                  id="range-counselor-density"
                  type="range"
                  min="50"
                  max="500"
                  step="25"
                  value={counselorDensity}
                  onChange={(e) => setCounselorDensity(parseInt(e.target.value))}
                  className="w-full accent-amber-500 bg-stone-800 h-1 rounded"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono mt-1">
                  <span>1 : 50 (Incredibly Dense)</span>
                  <span>1 : 250</span>
                  <span>1 : 500 (Sparse)</span>
                </div>
              </div>

              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800/80">
                <p className="text-[9px] font-mono uppercase tracking-widest text-amber-500 mb-1">Licence Scope Detail</p>
                <p className="text-xs text-stone-300 leading-relaxed font-light">{simulatorMetrics.coverageText}</p>
              </div>
            </div>

            {/* Right Side: Outputs Showcase */}
            <div id="sim-outputs" className="lg:col-span-5 bg-stone-950 rounded-2xl p-6 border border-stone-800 flex flex-col justify-between min-h-[350px]">
              <div className="space-y-6">
                <div>
                  <span className="text-stone-400 text-xs font-mono tracking-widest uppercase block mb-1">Estimated Annual Fee</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-4xl font-[family-name:var(--font-display)] font-black text-amber-500">${simulatorMetrics.annualLicensing}</span>
                    <span className="text-stone-400 text-xs font-mono">USD/Yr</span>
                  </div>
                </div>

                <div className="border-t border-stone-800 pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-350">
                      <Percent className="w-4 h-4 text-amber-500" />
                      <span className="text-xs">NIL Rules Compliance Protection KPI</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-emerald-500">{simulatorMetrics.complianceScore}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-350">
                      <Users className="w-4 h-4 text-amber-500" />
                      <span className="text-xs">Burnout & Fatigue Mitigation Ratio</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-emerald-500">{simulatorMetrics.riskReduction}%</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-800 pt-6 mt-6">
                <button
                  id="btn-partnership-schedule"
                  onClick={() => alert(`Strategic licensing simulation requested for ${studentCount} pathfinders on ${licenceTier.toUpperCase()} configuration. In a live administration, our educational covenants coordinator will schedule a briefing.`)}
                  className="w-full bg-[#ffffff] hover:bg-[#f5f5f4] text-stone-950 font-semibold py-3 px-4 rounded-xl text-xs tracking-wider uppercase transition shadow-md"
                >
                  Request Licensing Briefing
                </button>
                <p className="text-center text-[10px] text-stone-500 mt-3">
                  Pricing matrices do not include additional white-label theme configurations.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}