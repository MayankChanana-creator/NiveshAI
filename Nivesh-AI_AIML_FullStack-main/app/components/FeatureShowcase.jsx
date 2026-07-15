"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    id: 1,
    badge: "Virtual Trading",
    title: "Sandbox Virtual Trading",
    subtitle: "Credit-based point system",
    description:
      "Practice trading with ₹10,00,000 virtual credits in a risk-free sandbox environment. Compete on leaderboards, test strategies, and build confidence before investing real money.",
    image: "/feature_sandbox.png",
    gradient: "from-cyan-500/20 to-blue-600/20",
    accentColor: "#38bdf8",
    tags: ["Paper Trading", "Leaderboard", "Risk-Free"],
  },
  {
    id: 2,
    badge: "Risk Analytics",
    title: "Trade Prediction with AI",
    subtitle: "AI-Powered Market Analysis",
    description:
      "Understand your risk before you invest. Our AI Trade Prediction runs thousands of market scenarios to show you profit probability, expected returns, and best/worst case outcomes — paired with AI-driven recommendations.",
    image: "/feature_loss_probability.png",
    gradient: "from-purple-500/20 to-indigo-600/20",
    accentColor: "#a78bfa",
    tags: ["Trade Prediction", "Risk Analysis", "AI Insights"],
  },
  {
    id: 3,
    badge: "Automation",
    title: "AI Agent for Automated Trading",
    subtitle: "Your personal trading copilot",
    description:
      "Let our AI agent handle the heavy lifting. Set strategy rules, define entry/exit triggers, and let the agent execute trades automatically — complete with stop-loss management and live P&L tracking.",
    image: "/feature_ai_agent.png",
    gradient: "from-emerald-500/20 to-teal-600/20",
    accentColor: "#34d399",
    tags: ["Auto-Execute", "Strategy Builder", "Stop-Loss"],
  },
  {
    id: 4,
    badge: "Social",
    title: "Community Platform for Investors",
    subtitle: "Connect, discuss, grow together",
    description:
      "Join a vibrant community of investors. Share trade ideas, discuss market movements, follow expert analysts, and level up your investing knowledge through collaborative learning.",
    image: "/feature_community.png",
    gradient: "from-amber-500/20 to-orange-600/20",
    accentColor: "#fbbf24",
    tags: ["Social Feed", "Expert Analysis", "Live Chat"],
  },
];

/* ─────────────────────────────────────────────────────────
   Reusable feature‑text block (used on desktop left + mobile)
   ───────────────────────────────────────────────────────── */
function FeatureText({ feature, animate = true }) {
  const inner = (
    <div className="max-w-lg">
      {/* Badge */}
      <span
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border mb-6"
        style={{
          color: feature.accentColor,
          borderColor: `${feature.accentColor}40`,
          backgroundColor: `${feature.accentColor}10`,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: feature.accentColor }}
        />
        {feature.badge}
      </span>

      {/* Title */}
      <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
        {feature.title}
      </h3>

      {/* Subtitle */}
      <p className="mt-2 text-lg font-medium" style={{ color: feature.accentColor }}>
        {feature.subtitle}
      </p>

      {/* Description */}
      <p className="mt-4 text-base md:text-lg text-slate-400 leading-relaxed">
        {feature.description}
      </p>

      {/* Tags */}
      <div className="mt-6 flex flex-wrap gap-2">
        {feature.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-white/[0.05] text-slate-300 border border-white/10"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <button
        className="mt-8 group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-300 hover:scale-[1.03]"
        style={{
          color: feature.accentColor,
          borderColor: `${feature.accentColor}50`,
          backgroundColor: `${feature.accentColor}10`,
        }}
      >
        Explore Feature
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-hover:translate-x-1 transition-transform"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </div>
  );

  if (!animate) return inner;

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: false, amount: 0.4 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {inner}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Feature image block (used on right sticky + mobile inline)
   ───────────────────────────────────────────────────────── */
function FeatureImage({ feature, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      {/* Glowing background */}
      <div
        className={`absolute -inset-8 rounded-3xl bg-gradient-to-br ${feature.gradient} blur-3xl opacity-40`}
      />
      {/* Image */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
        <img src={feature.image} alt={feature.title} className="w-full h-auto object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────── */
export default function FeatureShowcase() {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const featureRefs = useRef([]);

  // Track which feature section is in view
  useEffect(() => {
    const observers = [];

    featureRefs.current.forEach((el, i) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(i);
          }
        },
        { threshold: 0.35, rootMargin: "-5% 0px -5% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative bg-gradient-to-b from-slate-950 via-[#0a1628] to-slate-950"
    >
      {/* ── Desktop layout: side‑by‑side flex ── */}
      <div className="hidden lg:flex relative">
        {/* LEFT column — scrollable text panels */}
        <div className="w-[45%] relative z-10">
          {features.map((feature, i) => (
            <div
              key={feature.id}
              ref={(el) => (featureRefs.current[i] = el)}
              className="min-h-screen flex items-center px-12 xl:px-20"
            >
              <FeatureText feature={feature} />
            </div>
          ))}
        </div>

        {/* RIGHT column — sticky image */}
        <div className="w-[55%] relative">
          <div className="sticky top-0 h-screen flex items-center justify-center p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="w-full max-w-[640px]"
              >
                <FeatureImage feature={features[activeIndex]} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Mobile / Tablet layout: stacked ── */}
      <div className="lg:hidden">
        {features.map((feature, i) => (
          <div
            key={feature.id}
            ref={(el) => {
              // only set ref on mobile if desktop refs aren't set
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                featureRefs.current[i] = el;
              }
            }}
            className="py-20 px-6 md:px-12"
          >
            <FeatureText feature={feature} />
            <div className="mt-10 relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              <div
                className={`absolute -inset-4 rounded-3xl bg-gradient-to-br ${feature.gradient} blur-2xl opacity-30`}
              />
              <img
                src={feature.image}
                alt={feature.title}
                className="relative w-full h-auto object-cover rounded-2xl"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
