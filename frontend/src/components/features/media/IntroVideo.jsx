"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Tv, 
  BookOpen, 
  Flame, 
  Sparkles,

 
  Info,
  Clock
} from 'lucide-react';
import { motion, } from 'motion/react';

const CHANNELS = [
  {
    id: 'ch-philosophy',
    title: 'Orientation, Mission, and Core Philosophy',
    speaker: 'Marcus Vance Sr., Founder & Fiduciary Champion',
    durationString: '06:12',
    videoUrl: '/welcome.mp4',
    chapters: [
      { time: 0, title: 'Introduction to TrueTrek Learning' },
      { time: 45, title: 'The 11-Tier Framework Vision' },
      { time: 135, title: 'Bridging Law, Wealth, and Personal Drive' },
      { time: 270, title: 'Stewardship of Generational Legacies' }
    ],
    transcript: [
      { time: 0, text: 'Welcome, pathfinders, to the core orientation walkthrough for TrueTrek Learning.' },
      { time: 11, text: 'This platform is structured around a simple, powerful truth.' },
      { time: 22, text: 'Raw craft is not enough; survival in elite networks requires compliance readiness.' },
      { time: 33, text: 'We designed the 11 Tiers to serve of immediate, practical roadmap metrics.' },
      { time: 45, text: 'Transitioning to our tier-based framework means auditing your personal footprint.' },
      { time: 60, text: 'Our student portfolio maps developmental spikes from early high school to legacy offices.' },
      { time: 80, text: 'Athletes learn pre-contract non-competes; Scholars write elite essay structures.' },
      { time: 105, text: 'And independent venture founders formulate safe corporate structures.' },
      { time: 135, text: 'We do not sell general advice. We review redline contract covenants.' },
      { time: 160, text: 'Listen as Coach Vance Miller, Amanda Ross, Esq., and Simone Chen guide each scenario.' },
      { time: 185, text: 'This video introduces how you can navigate the daily Student Portal drills.' },
      { time: 220, text: 'Make decisions on actual corporate, clinical, and administrative dilemmas.' },
      { time: 270, text: 'Our mission is simple: secure your eligibility, scale your assets, and build your legacy.' },
      { time: 310, text: 'We invite you to log into your portal today and begin your elite journey.' }
    ]
  },
  {
    id: 'ch-curriculum',
    title: 'The 11-Tier Curriculum Pathing Guide',
    speaker: 'Amanda Ross, Esq., Lead Compliance Counsel',
    durationString: '04:45',
    videoUrl: '/welcome.mp4',
    chapters: [
      { time: 0, title: 'The Anatomy of the Tiers' },
      { time: 30, title: 'Athletic, Academic, and Professional Tracks' },
      { time: 120, title: 'NCAA Compliance Decoded' },
      { time: 210, title: 'Unlocking Ivy League Admission Spikes' }
    ],
    transcript: [
      { time: 0, text: 'Hello, this is Amanda Ross. Let us audit how our 11 Tiers are constructed.' },
      { time: 10, text: 'Every tier has a target audience, core focus areas, and certified outcomes.' },
      { time: 25, text: 'We divide instructions into athletic commitments, scholarly placement, and venture scale.' },
      { time: 45, text: 'For youth athletes foundation we lay down elite coach correspondence guidelines.' },
      { time: 70, text: 'For scholars, we optimize common apps, recommendation solicitations, and interviews.' },
      { time: 95, text: 'And for active collegiate pros, we help navigate NIL legal frameworks and taxes.' },
      { time: 120, text: 'Understand that a single bad signature in high school can block commercial rights.' },
      { time: 155, text: 'We highlight exact legal pitfalls so students maintain complete eligibility safety.' },
      { time: 180, text: 'The curriculum is adaptive: completing mock assessments unlocks higher levels.' },
      { time: 210, text: 'We teach a concept called the Academic Spike - rejecting well-roundedness for depth.' },
      { time: 250, text: 'By scaling early automation projects, young builders generate real-world leverage.' },
      { time: 275, text: 'Whether your path is D1 sports, software ventures, or parenting, we guide you safe.' }
    ]
  },
  {
    id: 'ch-portal',
    title: 'The Student Portal & Live Drills Walkthrough',
    speaker: 'Dr. Simone Chen, Head of Neurobiology',
    durationString: '05:30',
    videoUrl: '/welcome.mp4',
    chapters: [
      { time: 0, title: 'The Decision Physics Sandbox' },
      { time: 40, title: 'Circadian Cycles & Rest Habit Compliance' },
      { time: 110, title: 'The Advisory Council AI Framework' },
      { time: 220, title: 'Earning Certified Strategic Credentials' }
    ],
    transcript: [
      { time: 0, text: 'Greetings, this is Dr. Simone Chen. Let us explore the neuropsychology of our Portal.' },
      { time: 12, text: 'We do not believe in standard multiple-choice tests.' },
      { time: 25, text: 'The Decision Sandbox mimics high-stress scenarios under intense time-debt.' },
      { time: 40, text: 'We prioritize autonomic preservation: sleep cycles, hydration patterns, and stress diagnostics.' },
      { time: 65, text: 'When taking a drill, you must evaluate option scores ranging from zero to one hundred.' },
      { time: 85, text: 'Every choice presents a specific steward rationale and feedback.' },
      { time: 110, text: 'Our Mastermind Advisory Council lets you converse directly with expert profiles.' },
      { time: 140, text: 'Type custom strategic dilemmas to Coach Vance or Richard Sterling.' },
      { time: 175, text: 'Their system prompts respond using real legal codes and high-performance guidelines.' },
      { time: 210, text: 'Your streak days, total scores, and finished checklist constitute your student profile.' },
      { time: 240, text: 'This profile serves as direct proof of professional, athletic, or academic compliance.' },
      { time: 280, text: 'Let’s look at a live demonstration of solving Drill-3 under venture SAFE covenants.' }
    ]
  }
];

export default function IntroVideo() {
  const [activeChannelId, setActiveChannelId] = useState('ch-philosophy');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [duration, setDuration] = useState(0); // in seconds
  const [hasLoaded, setHasLoaded] = useState(true);

  const videoRef = useRef(null);
  const transcriptContainerRef = useRef(null);

  const activeChannel = CHANNELS.find(c => c.id === activeChannelId) || CHANNELS[0];
  const maxDuration = 330; // 5.5 minutes normalized ceiling

  // Select channel
  const handleSelectChannel = (id) => {
    setActiveChannelId(id);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  };

  // Playback handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => console.log('Iframe play auto-blocked:', err));
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const nextDuration = videoRef.current.duration;
    setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleChapterClick = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    setIsPlaying(true);
    videoRef.current.play().catch(() => {});
  };

  // Find active chapter title
  const currentChapter = [...activeChannel.chapters]
    .reverse()
    .find(ch => currentTime >= ch.time) || activeChannel.chapters[0];

  // Find active transcript index
  const activeTranscriptIndex = [...activeChannel.transcript]
    .reverse()
    .find(tr => currentTime >= tr.time);

  // Auto scroll transcript logic
  useEffect(() => {
    if (transcriptContainerRef.current && activeTranscriptIndex) {
      const activeEl = document.getElementById(`tr-text-${activeTranscriptIndex.time}`);
      if (activeEl) {
        transcriptContainerRef.current.scrollTo({
          top: activeEl.offsetTop - 60,
          behavior: 'smooth'
        });
      }
    }
  }, [activeTranscriptIndex]);

  // Format helper
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="intro-video-orientation-layout" className="bg-stone-900 border border-stone-800 rounded-3xl p-6 md:p-8 relative overflow-hidden text-white shadow-2xl">
      <div id="glow-intro-sphere" className="absolute -top-12 -left-12 w-80 h-80 rounded-full bg-amber-600/10 blur-[100px] pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Professional Video Viewport */}
        <div className="lg:col-span-8 flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-850 pb-4">
            <div className="space-y-1">
              <span className="text-amber-500 font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 leading-none">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Active Orientation Broadcast
              </span>
              <h3 className="text-lg md:text-xl font-serif font-black text-stone-105">
                {activeChannel.title}
              </h3>
              <p className="text-[11px] text-stone-400 font-mono">
                Mastermind Narrator: <strong className="text-amber-100">{activeChannel.speaker}</strong>
              </p>
            </div>
            
            {/* Playback Chapter Pill */}
            <div className="bg-stone-850 border border-stone-750 px-3.5 py-1.5 rounded-xl font-mono text-[10.5px] text-stone-300 self-start sm:self-center flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              CHAPTER: <span className="text-white font-bold uppercase tracking-wider truncate max-w-[140px]">{currentChapter?.title || 'Intro'}</span>
            </div>
          </div>

          {/* Interactive Player Box */}
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-stone-800 shadow-inner group">
            {/* Real HTML5 ambient looping sample */}
            <video
              ref={videoRef}
              src={activeChannel.videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlay}
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover select-none cursor-pointer"
            />

            {/* Inner Video Telemetry Hud */}
            <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none flex justify-between text-[9px] font-mono opacity-80 select-none">
              <div className="flex gap-4">
                <span>CHANNEL STATUS: SECURED FEED</span>
                <span className="text-amber-400">FPS: 60.00 // 1080P CLOUD</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                LIVE MATRIX FEED
              </div>
            </div>

            {/* Huge Play overlay on Pause */}
            {!isPlaying && (
              <div 
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer transition-all duration-300 backdrop-blur-xs"
              >
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-20 h-20 bg-amber-600 hover:bg-amber-500 text-white rounded-full flex items-center justify-center shadow-2xl border border-amber-400/40"
                >
                  <Play className="w-8 h-8 fill-white ml-1.5 text-white" />
                </motion.button>
              </div>
            )}

            {/* Floating Sound State Pill */}
            <div className="absolute bottom-16 right-4 pointer-events-none bg-stone-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-[9px] font-mono text-stone-300 border border-stone-750 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isMuted ? 'UNMUTE FOR ADVISOR AUDIO BROADCAST' : 'SYSTEM BALANCED AUDIO'}
            </div>

            {/* Custom Control Bar overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2.5">
              
              {/* Scrub line track */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold text-stone-300 w-10 shrink-0 select-none">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || maxDuration}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-stone-800 rounded-lg appearance-auto cursor-pointer focus:outline-none accent-amber-500"
                />
                <span className="text-[10px] font-mono text-stone-400 w-10 shrink-0 text-right select-none">
                  {duration ? formatTime(duration) : activeChannel.durationString}
                </span>
              </div>

              {/* Bottom Row controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <button 
                    onClick={togglePlay} 
                    className="text-[#faece1] hover:text-white transition"
                    title={isPlaying ? 'Pause Feed' : 'Launch Orientation Playback'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                  </button>

                  <button 
                    onClick={toggleMute} 
                    className="text-[#faece1] hover:text-white transition flex items-center gap-1.5"
                    title={isMuted ? 'Activate Sound' : 'Deactivate Sound'}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-amber-500" /> : <Volume2 className="w-5 h-5 text-white" />}
                  </button>

                  <div className="hidden sm:flex items-center gap-2 border-l border-stone-800 pl-3.5 text-[9.5px] font-mono text-stone-400">
                    <span className="text-amber-500">DYNAMIC DECODER ACTIVE:</span>
                    <span>H.264 CODES MATRIFIED</span>
                  </div>
                </div>

                {/* Chapter Ticks quick shortcuts shortcuts */}
                <div className="flex items-center gap-1 bg-[#141211]/60 px-2 py-1 rounded border border-stone-800/80">
                  <span className="text-[8px] font-mono tracking-widest text-stone-500 mr-2 uppercase">Jump Chapter</span>
                  {activeChannel.chapters.map((ch, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChapterClick(ch.time)}
                      className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[9px] font-bold border transition ${
                        currentTime >= ch.time 
                          ? 'bg-amber-600/25 border-amber-500 text-white' 
                          : 'bg-stone-850 hover:bg-stone-800 border-stone-700 text-stone-400'
                      }`}
                      title={ch.title}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-stone-850 border border-stone-800/60 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-stone-300">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong>Interactive Orientation Guide:</strong> Click any of the digital timeline indices or select from the right-hand Channels to adjust Amanda Ross, Esq. and Coach Vance’s dynamic feeds programmatically.
            </p>
          </div>
        </div>

        {/* Right Side: Channel Selector & Live Scrolling Transcript Telemetry */}
        <div className="lg:w-80 shrink-0 space-y-6">
          
          {/* channels card list */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
              <Tv className="w-4 h-4 text-amber-500" />
              ORIENTATION FEED CHANNELS
            </div>

            <div className="space-y-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChannel(ch.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                    activeChannelId === ch.id 
                      ? 'bg-amber-600/10 border-amber-500 text-white shadow-md' 
                      : 'bg-stone-850/40 border-stone-800/60 text-stone-400 hover:bg-stone-850 hover:border-stone-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    activeChannelId === ch.id ? 'bg-amber-600/20 border-amber-400 text-white' : 'bg-stone-900 border-stone-750 text-stone-500'
                  }`}>
                    {ch.id === 'ch-philosophy' && <Sparkles className="w-4 h-4" />}
                    {ch.id === 'ch-curriculum' && <BookOpen className="w-4 h-4" />}
                    {ch.id === 'ch-portal' && <Flame className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-bold leading-tight line-clamp-1">{ch.title}</p>
                    <div className="flex justify-between items-center text-[10px] font-mono text-stone-400">
                      <span>{ch.id === 'ch-philosophy' ? 'CH-01' : ch.id === 'ch-curriculum' ? 'CH-02' : 'CH-03'}</span>
                      <span className="bg-stone-900 px-1.5 py-0.5 rounded text-[9px] text-[#faece1]">{ch.durationString}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* live scrolling transcripts box */}
          <div className="border border-stone-800 bg-[#141211] rounded-2xl p-4 flex flex-col h-[280px]">
            <span className="text-[9px] font-mono tracking-widest text-[#faece1] uppercase block mb-3 border-b border-stone-850 pb-2">
              AUTO-TRACK TRANSCRIPT DECODER
            </span>

            {/* Transcripts container scroll list */}
            <div 
              ref={transcriptContainerRef}
              className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scroll scroll-smooth"
            >
              {activeChannel.transcript.map((tr, index) => {
                const isActive = activeTranscriptIndex?.time === tr.time;
                return (
                  <div
                    id={`tr-text-${tr.time}`}
                    key={index}
                    onClick={() => handleChapterClick(tr.time)}
                    className={`p-2.5 rounded-lg border text-[11px] font-sans leading-relaxed transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-amber-600/15 border-amber-600/30 text-white font-medium shadow-2xs' 
                        : 'border-transparent text-stone-400 hover:bg-stone-850/40 hover:text-stone-200'
                    }`}
                  >
                    <span className={`font-mono text-[9px] block mb-0.5 ${isActive ? 'text-amber-400' : 'text-stone-500'}`}>
                      [{formatTime(tr.time)}]
                    </span>
                    {tr.text}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}