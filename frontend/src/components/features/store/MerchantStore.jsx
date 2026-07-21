"use client";

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Tag, 
  Check, 
  CreditCard, 
  Sparkles, 
  Package, 
  Download, 
  Info,
 
  X,
  ShieldCheck,

  Send,
  Brain,

  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ADVISOR_PERSONAS } from '@/data/curriculum';
import { requestAdvisorAdvice } from '@/services/advisorService';
import MarkdownMiniRenderer from '@/components/ui/MarkdownMiniRenderer';

const PRODUCTS = [
  {
    id: 'prod-syllabus-license',
    name: 'The 11-Tier Legacy Syllabus (Lifetime Licensing)',
    category: 'Licensing',
    price: 4500,
    description: 'Permanent institutional organization-wide clearance for all 11 TrueTrek Learning tiers, compliance slide decks, and handbook covenants.',
    details: 'Includes direct annual curriculum alignment updates, FERPA certification blueprints, and print-ready master vectors for classroom deployment.',
    image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600',
    isDigital: true,
    stock: 'Institutional Access Available'
  },
  {
    id: 'prod-safe-templates',
    name: 'Pre-Seed Venture SAFE Templates Pack',
    category: 'Digital Guides',
    price: 450,
    description: 'High-yield Simple Agreement for Future Equity (SAFE) covenants optimized by corporate specialists to prevent predatory early dilution.',
    details: 'Documents include side-letter covenants, standard 20% discount provisions, customized valuation caps, and comprehensive board resolution templates.',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600',
    isDigital: true,
    stock: 'Instant Digital Protocol Delivery'
  },
  {
    id: 'prod-nil-handbook',
    name: 'NIL Contract Legal Redline Handbook',
    category: 'Digital Guides',
    price: 299,
    description: 'Amanda Ross, Esq. blueprint mapping athletic team uniforms guidelines, beverage exclusivity strategies, and state disclosure forms.',
    details: 'Features 15 annotated real-world clauses, boilerplate letter templates to send to institutional compliance departments, and trademark protection filings checklists.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
    isDigital: true,
    stock: 'Instant Digital Protocol Delivery'
  },
  {
    id: 'prod-jersey',
    name: 'TrueTrek Learning Branded Athletic Jersey',
    category: 'Apparel & Gear',
    price: 120,
    description: 'Ultra-light high-durability mesh practice jersey optimized for body heat regulation. Prominently features the signature "TTL" emblem.',
    details: 'Tailored fit using high-wicking synthetic fiber blend, laser-cut ventilation ports, and high-visibility light reflective safety decals.',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600',
    isDigital: false,
    stock: '35 Units in Stock (Fulfillment Ready)'
  },
  {
    id: 'prod-cns-mask',
    name: 'Circadian Stabilization Light-Block Mask',
    category: 'Apparel & Gear',
    price: 45,
    description: 'Medical-grade zero-pressure light shielding design tailored for critical REM optimization sessions during high-pressure training drills.',
    details: 'Equipped with organic memory foam contours, sound-attenuating elastic covenants, and micro-aerated breathable natural fiber linings.',
    image: 'https://images.unsplash.com/photo-1511295742364-92793113702c?auto=format&fit=crop&q=80&w=600',
    isDigital: false,
    stock: '150 Units in Stock (Fulfillment Ready)'
  },
  {
    id: 'prod-workbook',
    name: 'Executive Cognitive Strategy Workbook',
    category: 'Apparel & Gear',
    price: 65,
    description: 'High-contrast raw print journal for detailing daily strategic dilemmas, tactical cap-table allocations, and mental models logging.',
    details: '200 pages of premium 120gsm heavy stock, textured linen hardback binding with gold-debossed typography and matching silk ribbon placeholders.',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    isDigital: false,
    stock: '88 Units in Stock (Fulfillment Ready)'
  }
];

export default function MerchantStore() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Coupon processing state
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [couponError, setCouponError] = useState(null);

  // Detail Modal view
  const [viewingProduct, setViewingProduct] = useState(null);

  // Secure Checkout State
  const [checkoutStep, setCheckoutStep] = useState('idle');
  const [billingEmail, setBillingEmail] = useState('aiguy503@gmail.com');
  const [billingName, setBillingName] = useState('Marcus Vance Jr.');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [purchasedProducts, setPurchasedProducts] = useState([]);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState('');
  const [generatedLicenseKeys, setGeneratedLicenseKeys] = useState({});

  // AI Procurement Advisor States
  const [selectedAIAdvisorId, setSelectedAIAdvisorId] = useState('legal');
  const [userQuery, setUserQuery] = useState('');
  const [advisorFeedback, setAdvisorFeedback] = useState('');
  const [isAIRecommending, setIsAIRecommending] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState([]);

  // Function to query the advisor service
  const handleConsultAdvisor = async () => {
    if (!userQuery.trim()) return;
    setIsAIRecommending(true);
    setAdvisorFeedback('');
    setMatchedProducts([]);

    const advisor = ADVISOR_PERSONAS.find(a => a.id === selectedAIAdvisorId) || ADVISOR_PERSONAS[0];

    // Build specialized prompt to list our inventory items & teach the advisor how to select/review them
    const customizedSystemPrompt = `${advisor.systemPrompt}
    
You are serving as the Senior Advisory Concierge for the TrueTrek Learning LLC Strategic Store.
Analyze the student or organization's goals, and guide them with specific tactical advice.
In your advice, you MUST recommend one or premium items from our official depository inventory below.

Official Depository Catalog:
- "The 11-Tier Legacy Syllabus (Lifetime Licensing)" (Price: $4,500) - For institution-wide academic frameworks, licensing compliance, and teacher-ready print materials. Best for schools, recruiters, or booster networks. (Product ID: prod-syllabus-license)
- "Pre-Seed Venture SAFE Templates Pack" (Price: $450) - Pre-vetted simple agreements for future equity. High-yield terms to address valuation targets and block early predatory dilution. Best for founders or aspiring independent software builders. (Product ID: prod-safe-templates)
- "NIL Contract Legal Redline Handbook" (Price: $299) - Essential manual of real-world licensing clauses, compliance forms, uniform guides, and trademark safeguards. Best for high school recruited or collegiate varsity athletes. (Product ID: prod-nil-handbook)
- "TrueTrek Learning Branded Athletic Jersey" (Price: $120) - Strategic light-weight performance mesh with elite TTL monogram styling. Best for active field athletes or physical specialists. (Product ID: prod-jersey)
- "Circadian Stabilization Light-Block Mask" (Price: $45) - Absolute blackout contours with micro-aerated memory foam to maximize REM sleep and metabolic restoration. Best for high-performance competitors or hard-working executives. (Product ID: prod-cns-mask)
- "Executive Cognitive Strategy Workbook" (Price: $65) - Linen-hardbound gold-debossed journal for charting cap-table distributions, decision matrices, and daily logging. Best for leaders, venture directors, or active scholars. (Product ID: prod-workbook)

Instructions:
- Keep your tone completely in-character as ${advisor.name} (${advisor.title}).
- Review the user's specific query and deliver structured, high-IQ feedback.
- Explicitly recommend at least one and up to three specific matching products list from above. Write out their exact names in your explanation so the customer recognizes them.
- Explain clearly and in bullet points why those products perfectly match their current developmental track.
- Keep your output beautifully formatted in professional Markdown with solid headers. Avoid filler text.`;

    try {
      const data = await requestAdvisorAdvice({
          scenario: `User Specific Goals & Query:\n"${userQuery}"\n\nAdvisor, please evaluate my case and advise which items from our Strategic Store inventory I should acquire.`,
          systemPrompt: customizedSystemPrompt,
          advisorName: advisor.name
        });
      if (data.advice) {
        setAdvisorFeedback(data.advice);
        
        // Dynamic matching of inventory products based on text response keywords and IDs
        const detected = PRODUCTS.filter(p => {
          const lowerText = data.advice.toLowerCase();
          const lowerId = p.id.toLowerCase();
          const lowerName = p.name.toLowerCase();
          
          if (lowerText.includes(lowerId)) return true;
          if (lowerText.includes(lowerName)) return true;
          
          // Check for sub-covenant key matches to ensure smooth matching even if AI slightly abbreviates
          if (p.id === 'prod-syllabus-license' && (lowerText.includes('syllabus') || lowerText.includes('licensing') || lowerText.includes('11-tier'))) return true;
          if (p.id === 'prod-safe-templates' && (lowerText.includes('safe') || lowerText.includes('templates') || lowerText.includes('dilution'))) return true;
          if (p.id === 'prod-nil-handbook' && (lowerText.includes('nil') || lowerText.includes('handbook') || lowerText.includes('redline'))) return true;
          if (p.id === 'prod-jersey' && (lowerText.includes('jersey') || lowerText.includes('athletic apparel') || lowerText.includes('LE monogram'))) return true;
          if (p.id === 'prod-cns-mask' && (lowerText.includes('mask') || lowerText.includes('circadian') || lowerText.includes('light-block') || lowerText.includes('sleep'))) return true;
          if (p.id === 'prod-workbook' && (lowerText.includes('workbook') || lowerText.includes('journal') || lowerText.includes('strategy book'))) return true;
          
          return false;
        });
        
        setMatchedProducts(detected);
      } else if (data.error) {
        setAdvisorFeedback(`### Operational Outage\n\nFailed to get strategic recommendations from ${advisor.name}.\n\nDetails: *${data.error}*`);
      }
    } catch (err) {
      console.error('Advisor recommender fetch exception:', err);
      setAdvisorFeedback(`### Council Offline\n\nFailed to route secure recommendations dispatch. Reason: "${err.message || err}".`);
    } finally {
      setIsAIRecommending(false);
    }
  };

  const filteredProducts = activeCategory === 'All'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeCategory);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    // Trigger drawer opening on add
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const applyCoupon = () => {
    setCouponError(null);
    const cleaned = couponInput.toUpperCase().trim();
    if (cleaned === 'LEGACY20') {
      setAppliedDiscount({ code: 'LEGACY20', percent: 20 });
    } else if (cleaned === 'COMPLIANCE') {
      setAppliedDiscount({ code: 'COMPLIANCE', percent: 10 });
    } else if (cleaned === 'SCHOLAR') {
      setAppliedDiscount({ code: 'SCHOLAR', percent: 15 });
    } else {
      setCouponError('Invalid compliance promotion code');
    }
  };

  const removeCoupon = () => {
    setAppliedDiscount(null);
    setCouponInput('');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percent / 100) : 0;
  const discountedSubtotal = subtotal - discountAmount;
  const deliveryFee = cart.length === 0 ? 0 : (cart.every(item => item.product.isDigital) ? 0 : 18.50);
  const regulatoryTax = discountedSubtotal * 0.0825; // 8.25% state tax
  const totalAmount = discountedSubtotal + deliveryFee + regulatoryTax;

  const handleCheckout = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setCheckoutStep('processing');
    
    // Simulate high-tier secure ledger routing
    setTimeout(() => {
      const invoiceId = 'LE-INV-' + Math.floor(100000 + Math.random() * 900000);
      const keys = {};
      
      cart.forEach(item => {
        if (item.product.isDigital) {
          keys[item.product.id] = 'LE-KEY-' + Array.from({length: 4}, () => 
            Math.random().toString(36).substring(2, 7).toUpperCase()
          ).join('-');
        }
      });

      setGeneratedInvoiceId(invoiceId);
      setGeneratedLicenseKeys(keys);
      setPurchasedProducts([...cart]);
      setCart([]);
      setCheckoutStep('success');
    }, 2000);
  };

  return (
    <div id="merchant-store-container" className="min-h-screen bg-[#faf9f6] text-stone-900 pb-24">
      
      {/* Dynamic Header */}
      <div id="store-banner-layout" className="bg-[#1c1917] text-white py-16 px-6 border-b border-stone-800 relative overflow-hidden">
        <div id="ambient-dot-store" className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-amber-600/10 blur-[130px] -translate-y-1/2"></div>
        <div className="max-w-6xl mx-auto relative z-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-stone-850 border border-stone-750 px-3.5 py-1.5 rounded-full text-amber-500 font-mono text-xs uppercase tracking-wider">
              <ShoppingBag className="w-3.5 h-3.5" />
              Licensed Materials Depository
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-white">
              The Strategic Store
            </h2>
            <p className="text-stone-450 text-xs md:text-sm font-light max-w-xl leading-relaxed">
              Equip your academic program, secure pre-vetted compliance contract binders, and purchase elite high-performance athletic gear vetted by scouts.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4">
            <button 
              id="shopping-cart-toggle-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative bg-amber-600 hover:bg-amber-500 text-white p-4 rounded-2xl flex items-center gap-3 transition-all duration-200 shadow-md transform hover:scale-[1.02]"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider hidden sm:inline">Active Ledger</span>
              <span className="bg-white text-stone-950 text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center font-mono">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {/* Active Promos Reminder Banner */}
        <div className="bg-stone-105 border border-stone-200 rounded-2xl p-4 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-700 font-sans leading-relaxed">
            <span className="font-mono font-bold text-amber-850 uppercase tracking-widest mr-2">[COUPONS ELIGIBLE]</span>
            Use <code className="bg-stone-200 text-stone-900 border border-stone-250 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">LEGACY20</code> for 20% off high-tier licenses or <code className="bg-stone-200 text-stone-900 border border-stone-250 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">COMPLIANCE</code> for 10% off site-wide.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-mono font-semibold text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            SECURED LEDGER PROTOCOL
          </div>
        </div>

        {/* Mastermind Store Advisor Suite */}
        <section id="procurement-advisor-suite" className="mb-14 bg-stone-900 border border-stone-800 rounded-3xl p-6 md:p-8 relative overflow-hidden text-stone-205">
          <div id="advisor-suite-glow" className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-amber-600/10 blur-[110px] pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            {/* Header info */}
            <div className="flex items-start gap-4 border-b border-stone-800 pb-5">
              <div className="w-12 h-12 bg-amber-600/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20 shrink-0">
                <Brain className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1 text-left">
                <span className="text-amber-500 font-mono text-[9px] font-bold tracking-widest uppercase block">Intellectual Telemetry Analysis</span>
                <h3 className="text-xl md:text-2xl font-serif font-black text-white">Advisory Procurement Suite</h3>
                <p className="text-xs text-stone-400 font-light leading-relaxed">
                  Connect your personal scenarios directly with council advisors to formulate targeted pathway acquisitions. Get professional feedback on compliance rules and purchase-ready materials.
                </p>
              </div>
            </div>

            {/* Advisor Selector Buttons */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block text-left">Select Your Strategic Advisor</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {ADVISOR_PERSONAS.map((advisor) => (
                  <button
                    id={`store-advisor-btn-${advisor.id}`}
                    key={advisor.id}
                    onClick={() => {
                      setSelectedAIAdvisorId(advisor.id);
                      setAdvisorFeedback('');
                      setMatchedProducts([]);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                      selectedAIAdvisorId === advisor.id
                        ? 'bg-amber-600/10 border-amber-500 text-white shadow-lg shadow-amber-970/10'
                        : 'bg-stone-850/40 border-stone-800 text-stone-400 hover:bg-stone-800 hover:border-stone-705'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <img 
                        src={advisor.avatar} 
                        alt={advisor.name} 
                        className="w-10 h-10 rounded-full border object-cover border-stone-700 bg-stone-900 shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-100 truncate">{advisor.name}</p>
                        <p className="text-[9px] font-mono text-stone-450 truncate uppercase mt-0.5">{advisor.title.split('&')[0]}</p>
                      </div>
                    </div>
                    <p className="text-[9.5px] text-stone-400 font-light line-clamp-2 italic leading-normal">
                      &quot;{advisor.quote}&quot;
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Query Builder Box layout */}
            <div className="bg-stone-950 rounded-2xl p-6 border border-stone-850 space-y-4">
              <div className="text-left">
                <label className="text-[10px] font-mono text-[#faece1] uppercase tracking-widest block mb-2 font-bold">Configure Your Growth Goals / Scenario</label>
                <div className="relative">
                  <textarea
                    id="store-advisor-query-input"
                    rows={3}
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="e.g., I am a high school varsity athlete navigating college recruitment and NIL options. I want to build a compliant media presence and avoid contract traps. What do I need?"
                    className="w-full bg-stone-900/60 border border-stone-800 rounded-xl p-4 pr-12 text-xs font-mono text-stone-100 placeholder-stone-550 focus:outline-none focus:border-amber-600 focus:bg-stone-900 leading-relaxed"
                  />
                  <div className="absolute bottom-3.5 right-3.5 text-stone-500 text-[10px] font-mono select-none">
                    {userQuery.length} chars
                  </div>
                </div>
              </div>

              {/* Preset prompt pills */}
              <div className="space-y-1.5 text-left">
                <p className="text-[9px] font-mono text-stone-550 uppercase tracking-wider font-semibold">Quick Inquiries</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "I am establishing a collegiate-backed project and need institutional licensing materials.",
                    "I am launching a tech seed venture and want template SAFE legal covenants.",
                    "High stress and morning training is depleting my REM sleep recovery cycles."
                  ].map((preset, idx) => (
                    <button
                      id={`preset-store-query-${idx}`}
                      key={idx}
                      onClick={() => setUserQuery(preset)}
                      className="bg-[#141211] hover:bg-stone-800 border border-stone-800 text-stone-300 text-[10px] px-3.5 py-1.5 rounded-lg transition text-left cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit triggers btn */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                <p className="text-[10px] font-mono text-stone-400 uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Advisor recommendations appear below instantly
                </p>
                <button
                  id="query-store-advisor-btn"
                  onClick={handleConsultAdvisor}
                  disabled={isAIRecommending || !userQuery.trim()}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 text-xs font-mono font-extrabold uppercase tracking-widest py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-amber-970/15 cursor-pointer"
                >
                  {isAIRecommending ? 'Compiling Parameters...' : 'Ask AI Advisor'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recommendation Outputs result block */}
            <AnimatePresence>
              {(isAIRecommending || advisorFeedback) && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  id="store-advisor-result-panel"
                  className="bg-[#141211] border border-stone-800 rounded-2xl p-6 relative overflow-hidden space-y-6 shadow-inner text-left"
                >
                  <div className="absolute top-0 left-0 w-1 bg-amber-600 h-full"></div>
                  
                  <div className="flex justify-between items-center border-b border-stone-850 pb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-205">
                        Analysis Report from {ADVISOR_PERSONAS.find(a => a.id === selectedAIAdvisorId)?.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-stone-850 px-2 py-0.5 rounded text-stone-400">
                      Clearance Protocol Active
                    </span>
                  </div>

                  {isAIRecommending ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <span className="relative flex h-8 w-8">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-8 w-8 bg-amber-600"></span>
                      </span>
                      <p className="text-xs font-mono text-stone-450 animate-pulse uppercase tracking-wider">Retrieving Council Match Intelligence...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <MarkdownMiniRenderer text={advisorFeedback} />

                      {/* Display Matched Products inline with a direct Add-to-Cart hook! */}
                      {matchedProducts.length > 0 && (
                        <div className="border-t border-stone-850 pt-5 mt-4 space-y-4">
                          <div className="flex items-center gap-2 text-left">
                            <Package className="w-4.5 h-4.5 text-amber-500" />
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                              RECOMMENDED ACQUISITION PATHWAY ASSETS ({matchedProducts.length})
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                            {matchedProducts.map((p) => (
                              <div
                                id={`matched-recommendation-${p.id}`}
                                key={p.id}
                                className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex gap-4 items-center justify-between hover:border-stone-700 transition"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <img 
                                    src={p.image} 
                                    alt={p.name} 
                                    className="w-12 h-12 object-cover rounded-lg shrink-0 border border-stone-800 bg-stone-900" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="min-w-0 text-left">
                                    <p className="text-xs font-bold text-white truncate">{p.name}</p>
                                    <p className="text-[10px] font-mono text-amber-500 mt-0.5">${p.price.toLocaleString()}</p>
                                  </div>
                                </div>

                                <button
                                  id={`add-matched-to-cart-${p.id}`}
                                  onClick={() => addToCart(p)}
                                  className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-mono text-[10px] uppercase font-bold py-2 px-3.5 rounded-lg shrink-0 transition cursor-pointer"
                                >
                                  Acquire Asset
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </section>

        {/* Categories Bar & List Layout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-5 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Licensing', 'Digital Guides', 'Apparel & Gear'].map((cat) => (
              <button
                id={`cat-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  activeCategory === cat 
                    ? 'bg-stone-950 text-white' 
                    : 'bg-stone-100 text-stone-605 border border-stone-200 hover:bg-stone-200'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-stone-600 font-mono">
            Displaying {filteredProducts.length} Premium Materials
          </p>
        </div>

        {/* Product Cards Grid */}
        <div id="store-grid-layout" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div
              id={`product-card-${product.id}`}
              key={product.id}
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-56 overflow-hidden bg-stone-100">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 to-transparent"></div>
                  
                  {/* Category Pill Tag */}
                  <span className="absolute top-4 left-4 text-[9px] font-mono tracking-wider font-extrabold uppercase bg-stone-950/80 text-amber-500 border border-stone-800/80 px-2.5 py-1 rounded-md backdrop-blur-xs">
                    {product.category}
                  </span>

                  {/* Stock/Digital Tag info */}
                  <span className="absolute bottom-4 right-4 text-[9px] font-mono font-semibold bg-white/90 text-stone-800 px-2.5 py-1 rounded-md shadow-xs">
                    {product.stock}
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-base font-serif font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed font-light line-clamp-3">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-stone-100 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono font-semibold text-stone-400 block uppercase tracking-wider">Invest Cost</span>
                  <span className="text-xl font-mono font-bold text-stone-900">${product.price.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`view-details-${product.id}`}
                    onClick={() => setViewingProduct(product)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-2.5 rounded-xl text-xs transition duration-200"
                    title="View Technical Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    id={`add-to-cart-${product.id}`}
                    onClick={() => addToCart(product)}
                    className="bg-stone-950 hover:bg-stone-800 text-white font-mono text-xs uppercase font-extrabold px-4 py-2.5 rounded-xl tracking-wider transition-all duration-200 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ACQUIRE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide Out Shopping Cart Drawer panel */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-overlay">
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsCartOpen(false)} />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
              >
                {/* Drawer Header */}
                <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-stone-950 flex items-center justify-center text-white">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-sm text-stone-900">Compliance Cart Ledger</h3>
                      <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wide">Secured Checkout Protocol</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-stone-400 hover:text-stone-750 p-1.5 rounded-full border border-stone-200 bg-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Cart Body */}
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-stone-105 flex items-center justify-center text-stone-400 border border-dashed border-stone-300">
                        <ShoppingBag className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-800">Your acquisition ledger is empty</p>
                        <p className="text-[11px] text-stone-500 mt-1 max-w-[240px] leading-relaxed mx-auto">Browse our elite educational frameworks and physical training support gear to assemble your kit.</p>
                      </div>
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="bg-stone-950 hover:bg-stone-800 text-white text-[10px] font-mono uppercase tracking-wider px-5 py-2.5 rounded-full font-bold transition"
                      >
                        Browse Collections
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs uppercase font-mono text-stone-400 tracking-wider">Reviewing Products Under Negotiation</p>
                      
                      {cart.map((item) => (
                        <div 
                          key={item.product.id}
                          className="flex gap-4 p-4 rounded-xl border border-stone-200 bg-stone-50/70"
                        >
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="w-16 h-16 object-cover rounded-lg border border-stone-200 shrink-0 bg-stone-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-bold text-stone-900 truncate">{item.product.name}</p>
                              <p className="text-[10px] font-mono text-amber-800 mt-0.5">${item.product.price.toLocaleString()}</p>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center border border-stone-200 rounded bg-white">
                                <button 
                                  onClick={() => updateQuantity(item.product.id, -1)}
                                  className="p-1 text-stone-500 hover:text-stone-900"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2.5 font-mono text-xs font-bold text-stone-900">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.product.id, 1)}
                                  className="p-1 text-stone-500 hover:text-stone-900"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button 
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-stone-400 hover:text-red-700 font-mono text-[10px] uppercase font-bold flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Coupon segment */}
                  {cart.length > 0 && (
                    <div className="border-t border-stone-200 pt-5 mt-6">
                      <label className="text-[10px] font-mono uppercase text-stone-400 tracking-widest block mb-2">Apply Compliance Promotion Code</label>
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input 
                            type="text" 
                            placeholder="LEGACY20, COMPLIANCE..." 
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 pl-9 pr-4 text-xs font-mono uppercase focus:outline-none focus:border-amber-600 focus:bg-white"
                          />
                        </div>
                        <button
                          onClick={applyCoupon}
                          className="bg-stone-900 hover:bg-stone-800 text-stone-105 font-mono text-xs uppercase tracking-widest px-4 rounded-xl font-bold"
                        >
                          Verify
                        </button>
                      </div>

                      {appliedDiscount && (
                        <div className="bg-emerald-50 text-emerald-850 px-3.5 py-2.5 rounded-xl border border-emerald-150 text-[11px] font-mono flex items-center justify-between mt-2">
                          <span className="flex items-center gap-1 text-emerald-800 font-bold">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            CODE STATUS ACTIVE ({appliedDiscount.code} - {appliedDiscount.percent}% off)
                          </span>
                          <button onClick={removeCoupon} className="text-emerald-700 hover:text-stone-900 underline uppercase text-[10px] font-bold">Remove</button>
                        </div>
                      )}

                      {couponError && (
                        <p className="text-orange-755 text-[10px] font-mono mt-1.5">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Drawer Footer Calculations & Checkout Panel */}
                <div className="p-6 border-t border-stone-200 bg-stone-50">
                  {cart.length > 0 && checkoutStep === 'idle' && (
                    <div className="space-y-4">
                      {/* Financial Checklist lines */}
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between text-stone-500">
                          <span>Pre-discount Subtotal</span>
                          <span>${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        {appliedDiscount && (
                          <div className="flex justify-between text-emerald-750">
                            <span>Compliance Code Discount ({appliedDiscount.percent}%)</span>
                            <span>-${discountAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-stone-500">
                          <span>Secure Vault Delivery Fee</span>
                          <span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between text-stone-500">
                          <span>Regulatory Outlay Tax (8.25%)</span>
                          <span>${regulatoryTax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between text-stone-900 border-t border-stone-200 pt-2 text-sm font-extrabold font-serif">
                          <span>Total Investment</span>
                          <span className="font-mono text-amber-850">${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                      </div>

                      {/* Interactive checkout form */}
                      <form onSubmit={handleCheckout} className="space-y-3.5 border-t border-stone-200 pt-4 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-mono text-stone-450 block uppercase tracking-wide">Steward Full Name</label>
                            <input 
                              type="text" 
                              required
                              value={billingName}
                              onChange={(e) => setBillingName(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-amber-600"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-stone-450 block uppercase tracking-wide">Clearance Email</label>
                            <input 
                              type="email" 
                              required
                              value={billingEmail}
                              onChange={(e) => setBillingEmail(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-amber-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-mono text-stone-450 block uppercase tracking-wide">Acquisition Card Number (Simulated)</label>
                          <div className="relative">
                            <CreditCard className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                              type="text" 
                              required
                              placeholder="4111 2222 3333 4444"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              className="w-full bg-white border border-stone-200 rounded-lg py-2 pl-9 pr-4 text-xs font-mono focus:outline-none focus:border-amber-600"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs uppercase font-extrabold py-3.5 rounded-xl tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-amber-970/20"
                        >
                          <CreditCard className="w-4 h-4" />
                          Execute Secured Checkout
                        </button>
                      </form>
                    </div>
                  )}

                  {checkoutStep === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                      <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850 animate-pulse">Securing Ledger Signatures</p>
                        <p className="text-[10px] text-stone-500 font-mono">Routing through Federal & Academy clearing gateways...</p>
                      </div>
                    </div>
                  )}

                  {checkoutStep === 'success' && purchasedProducts.length > 0 && (
                    <div className="bg-stone-900 text-white p-5 rounded-2xl space-y-4 relative overflow-hidden text-center border border-stone-800">
                      <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-emerald-600/10 blur-xl"></div>
                      
                      <div className="w-12 h-12 bg-emerald-600/20 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                        <Check className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-serif text-lg font-bold">Acquisition Authorized!</h4>
                        <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">CLEARANCE STICKER: {generatedInvoiceId}</p>
                      </div>

                      <div className="bg-stone-950 p-4 rounded-xl text-left border border-stone-850 space-y-2 text-xs font-mono">
                        <p className="text-[9px] text-[#faece1] font-bold uppercase tracking-wider">Acquisition Assets Receipt</p>
                        <div className="text-[10.5px] text-stone-300 space-y-1 max-h-[140px] overflow-y-auto">
                          {purchasedProducts.map((p, ix) => (
                            <div key={ix} className="flex justify-between gap-2 border-b border-stone-800/60 pb-1">
                              <span className="truncate pr-4">{p.product.name} (x{p.quantity})</span>
                              <span className="shrink-0 text-amber-500">${(p.product.price * p.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Displaying Licensing Cryptographic and Activation keys */}
                      {Object.keys(generatedLicenseKeys).length > 0 && (
                        <div className="bg-stone-950 p-4 rounded-xl text-left border border-stone-850 space-y-3">
                          <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest font-mono">Dynamic Digital Product Licenses</p>
                          {purchasedProducts.filter(item => item.product.isDigital).map((item, index) => (
                            <div key={index} className="space-y-1 text-xs">
                              <p className="text-[10px] text-stone-205 font-bold">{item.product.name}</p>
                              <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 p-2 rounded text-[10px] text-stone-50 text-center select-all font-mono tracking-wide">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                {generatedLicenseKeys[item.product.id]}
                              </div>
                              <button 
                                onClick={() => {
                                  alert(`Downloading complete document bundle for: ${item.product.name}\nInvoice: ${generatedInvoiceId}\nLicense key ${generatedLicenseKeys[item.product.id]} included in metadata package.`);
                                }}
                                className="w-full text-center text-[9px] font-mono text-amber-500 hover:text-amber-405 hover:underline uppercase tracking-wider flex items-center justify-center gap-1 bg-amber-600/5 py-1.5 rounded-md border border-amber-600/10 mt-1"
                              >
                                <Download className="w-2.5 h-2.5 animate-bounce" />
                                Grab Asset Bundle PDF
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-[9px] text-stone-400 leading-normal leading-relaxed">
                        Receipt, legal disclosure logs, and transport details dispatched to <strong className="text-stone-300 font-mono">{billingEmail}</strong>. Verification hashes matched perfectly!
                      </p>

                      <button
                        onClick={() => {
                          setCheckoutStep('idle');
                          setPurchasedProducts([]);
                          setGeneratedLicenseKeys({});
                          setIsCartOpen(false);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-mono text-xs uppercase font-extrabold py-2.5 rounded-xl tracking-wider transition shadow-sm"
                      >
                        Dismiss & Continue
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {viewingProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-xs" id="detail-modal-layout">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl overflow-hidden max-w-xl w-full border border-stone-200 shadow-2xl flex flex-col justify-between"
            >
              <button 
                onClick={() => setViewingProduct(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-950 bg-white/90 p-2 rounded-full shadow-md z-10 border border-stone-200 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative h-64 bg-stone-100">
                <img 
                  src={viewingProduct.image} 
                  alt={viewingProduct.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white text-left">
                  <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase bg-amber-600 text-white px-2 py-0.5 rounded-md mb-2 inline-block">
                    {viewingProduct.category}
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-white leading-tight">
                    {viewingProduct.name}
                  </h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#faece1] bg-[#1c1917] px-3 py-1.5 rounded-lg">
                    {viewingProduct.stock}
                  </span>
                  <div className="text-right">
                    <span className="text-[9px] font-mono font-semibold text-stone-400 block uppercase tracking-wider">Unit Investment</span>
                    <span className="text-2xl font-mono font-bold text-stone-950">${viewingProduct.price.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-stone-100 pt-4">
                  <p className="text-xs font-mono uppercase text-amber-800 tracking-wider font-bold">EXECUTIVE SPECIFICATIONS </p>
                  <p className="text-xs text-stone-600 leading-relaxed font-light">
                    {viewingProduct.description}
                  </p>
                </div>

                <div className="space-y-2 bg-stone-50 p-4 border border-stone-200 rounded-xl text-xs">
                  <p className="font-bold flex items-center gap-1.5 text-stone-850">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ACADEMY QUALITY COVENANT
                  </p>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    {viewingProduct.details}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-stone-100 mt-4 flex justify-between gap-4">
                <button
                  onClick={() => setViewingProduct(null)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs uppercase font-extrabold py-3 rounded-xl transition"
                >
                  Return to Depository
                </button>
                <button
                  onClick={() => {
                    addToCart(viewingProduct);
                    setViewingProduct(null);
                  }}
                  className="flex-1 bg-[#141211] hover:bg-amber-600 hover:text-white text-white font-mono text-xs uppercase font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add to Cart
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}