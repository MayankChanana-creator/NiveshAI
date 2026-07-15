"use client";
import { useEffect, useRef, useState } from "react";

// Re-export the new 3D avatar for easy access
export { PremiumAvatar3D } from "./AIDostAvatar3D";

/* ═══════════════════════════════════════════════════════════
   PREMIUM AVATAR — Indian male financial advisor
   Full-body SVG with blink · head-bob · lip-sync · glow ring
═══════════════════════════════════════════════════════════ */

export function PremiumAvatar({ isSpeaking = false, size = 220 }) {
  const [blink, setBlink]       = useState(false);
  const [headOff, setHeadOff]   = useState({ x: 0, y: 0 });
  const [mouthOpen, setMouth]   = useState(false);

  // ── Eye blink every 3-5 s ──────────────────────────────
  useEffect(() => {
    const schedule = () => {
      const delay = 3000 + Math.random() * 2000;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); schedule2(); }, 130);
      }, delay);
    };
    const schedule2 = () => schedule();
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  // ── Idle head micro-movement ───────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setHeadOff({
        x: (Math.random() - 0.5) * (isSpeaking ? 3 : 1.5),
        y: (Math.random() - 0.5) * (isSpeaking ? 2 : 1),
      });
    }, isSpeaking ? 220 : 800);
    return () => clearInterval(id);
  }, [isSpeaking]);

  // ── Mouth open/close while speaking ───────────────────
  useEffect(() => {
    if (!isSpeaking) { setMouth(false); return; }
    let t = false;
    const id = setInterval(() => { t = !t; setMouth(t); }, 175);
    return () => clearInterval(id);
  }, [isSpeaking]);

  const s = size;

  return (
    <svg
      width={s} height={s * 1.3}
      viewBox="0 0 200 260"
      style={{ overflow: "visible", filter: isSpeaking ? "drop-shadow(0 0 14px rgba(124,58,237,0.7))" : "drop-shadow(0 4px 12px rgba(0,0,0,0.5))", transition: "filter 0.4s" }}
    >
      <defs>
        {/* Skin gradient */}
        <radialGradient id="skin" cx="48%" cy="38%">
          <stop offset="0%" stopColor="#f5cba7" />
          <stop offset="100%" stopColor="#dc9965" />
        </radialGradient>
        {/* Hair */}
        <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1210" />
          <stop offset="100%" stopColor="#2d1f14" />
        </linearGradient>
        {/* Suit */}
        <linearGradient id="suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#0d0d1a" />
        </linearGradient>
        {/* Shirt */}
        <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f4ff" />
          <stop offset="100%" stopColor="#dde4f5" />
        </linearGradient>
        {/* Tie */}
        <linearGradient id="tie" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0392b" />
          <stop offset="60%" stopColor="#922b21" />
          <stop offset="100%" stopColor="#7b241c" />
        </linearGradient>
        {/* Eye whites */}
        <radialGradient id="eyeW" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8ecf0" />
        </radialGradient>
      </defs>

      {/* ── Head group — translates with head movement ── */}
      <g transform={`translate(${headOff.x},${headOff.y})`} style={{ transition: "transform 0.18s ease-out" }}>

        {/* ── SUIT / BODY ── */}
        {/* Left lapel */}
        <path d="M 58 180 L 70 155 L 100 175 L 100 260 L 30 260 L 30 190 Z" fill="url(#suit)" />
        {/* Right lapel */}
        <path d="M 142 180 L 130 155 L 100 175 L 100 260 L 170 260 L 170 190 Z" fill="url(#suit)" />
        {/* Left white lapel edge */}
        <path d="M 70 155 L 80 165 L 100 175" stroke="#c8cfe0" strokeWidth="0.8" fill="none" />
        {/* Right white lapel edge */}
        <path d="M 130 155 L 120 165 L 100 175" stroke="#c8cfe0" strokeWidth="0.8" fill="none" />
        {/* Shirt centre */}
        <rect x="88" y="148" width="24" height="60" rx="2" fill="url(#shirt)" />
        {/* Shirt buttons */}
        <circle cx="100" cy="162" r="1.5" fill="#b0bec5" />
        <circle cx="100" cy="172" r="1.5" fill="#b0bec5" />
        <circle cx="100" cy="182" r="1.5" fill="#b0bec5" />
        {/* Tie */}
        <path d="M 96 150 L 104 150 L 107 178 L 100 185 L 93 178 Z" fill="url(#tie)" />
        <path d="M 96 150 L 100 158 L 104 150" fill="#a93226" />
        {/* Tie highlight */}
        <path d="M 99 152 L 101 152 L 103 170 L 100 173" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" fill="none" />

        {/* Collar points */}
        <path d="M 88 154 L 94 162 L 100 155 L 106 162 L 112 154" fill="url(#shirt)" stroke="#d0d8ec" strokeWidth="0.5" />

        {/* ── NECK ── */}
        <rect x="91" y="134" width="18" height="20" rx="4" fill="url(#skin)" />

        {/* ── HEAD ── */}
        <ellipse cx="100" cy="108" rx="38" ry="42" fill="url(#skin)" />

        {/* ── HAIR ── */}
        <ellipse cx="100" cy="70" rx="38" ry="18" fill="url(#hair)" />
        <rect x="62" y="68" width="76" height="22" rx="10" fill="url(#hair)" />
        {/* Side burns */}
        <rect x="62" y="85" width="8" height="18" rx="4" fill="url(#hair)" />
        <rect x="130" y="85" width="8" height="18" rx="4" fill="url(#hair)" />
        {/* Hair detail */}
        <path d="M 70 70 Q 100 62 130 70" stroke="#2d1f14" strokeWidth="1.5" fill="none" />

        {/* ── EARS ── */}
        <ellipse cx="62" cy="108" rx="6" ry="8" fill="url(#skin)" />
        <ellipse cx="138" cy="108" rx="6" ry="8" fill="url(#skin)" />
        <path d="M 63 104 Q 67 108 63 113" stroke="#c08040" strokeWidth="1" fill="none" />
        <path d="M 137 104 Q 133 108 137 113" stroke="#c08040" strokeWidth="1" fill="none" />

        {/* ── EYEBROWS ── */}
        <path d="M 74 92 Q 82 88 90 91" stroke="#3d2314" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M 110 91 Q 118 88 126 92" stroke="#3d2314" strokeWidth="2.2" fill="none" strokeLinecap="round" />

        {/* ── EYES ── */}
        {/* Left eye socket */}
        <ellipse cx="82" cy="101" rx="10" ry="9" fill="url(#eyeW)" />
        {/* Right eye socket */}
        <ellipse cx="118" cy="101" rx="10" ry="9" fill="url(#eyeW)" />

        {/* Left iris */}
        <ellipse cx="82" cy="102" rx={blink ? 10 : 6} ry={blink ? 1.2 : 6} fill="#3d2314" style={{ transition: "ry 0.06s" }} />
        <ellipse cx="82" cy="102" rx={blink ? 10 : 3.5} ry={blink ? 0.7 : 3.5} fill="#1a0a04" style={{ transition: "ry 0.06s" }} />
        {/* Left shine */}
        {!blink && <circle cx="84.5" cy="99.5" r="1.5" fill="rgba(255,255,255,0.85)" />}

        {/* Right iris */}
        <ellipse cx="118" cy="102" rx={blink ? 10 : 6} ry={blink ? 1.2 : 6} fill="#3d2314" style={{ transition: "ry 0.06s" }} />
        <ellipse cx="118" cy="102" rx={blink ? 10 : 3.5} ry={blink ? 0.7 : 3.5} fill="#1a0a04" style={{ transition: "ry 0.06s" }} />
        {/* Right shine */}
        {!blink && <circle cx="120.5" cy="99.5" r="1.5" fill="rgba(255,255,255,0.85)" />}

        {/* Upper eyelids */}
        <path d="M 72 101 Q 82 94 92 101" stroke="#5d3a22" strokeWidth="1.4" fill="none" />
        <path d="M 108 101 Q 118 94 128 101" stroke="#5d3a22" strokeWidth="1.4" fill="none" />
        {/* Lower eyelid shadow */}
        <path d="M 73 103 Q 82 108 91 103" stroke="#c9956a" strokeWidth="0.6" fill="none" />
        <path d="M 109 103 Q 118 108 127 103" stroke="#c9956a" strokeWidth="0.6" fill="none" />

        {/* ── NOSE ── */}
        <path d="M 100 107 L 95 120 Q 100 124 105 120 Z" fill="#c88040" opacity="0.45" />
        <ellipse cx="95" cy="121" rx="4" ry="2.5" fill="#b87040" opacity="0.4" />
        <ellipse cx="105" cy="121" rx="4" ry="2.5" fill="#b87040" opacity="0.4" />

        {/* ── MOUTH ── */}
        {/* Lips */}
        {mouthOpen ? (
          <>
            {/* Upper lip */}
            <path d="M 87 130 Q 94 127 100 129 Q 106 127 113 130 Q 106 134 100 133 Q 94 134 87 130 Z" fill="#c0705a" />
            {/* Mouth opening */}
            <path d="M 89 131 Q 100 142 111 131" fill="#1a0808" />
            {/* Teeth hint */}
            <path d="M 91 133 Q 100 137 109 133" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" fill="none" />
            {/* Lower lip */}
            <path d="M 87 130 Q 100 142 113 130 Q 106 137 100 139 Q 94 137 87 130 Z" fill="#d4806a" />
          </>
        ) : (
          <>
            <path d="M 87 130 Q 100 136 113 130" stroke="#b56040" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 87 130 Q 94 126 100 127 Q 106 126 113 130" fill="#c0705a" />
            <path d="M 87 130 Q 100 135 113 130 Q 106 134 100 133 Q 94 134 87 130 Z" fill="#d4806a" />
          </>
        )}

        {/* ── CHEEKS (subtle blush) ── */}
        <ellipse cx="74" cy="118" rx="9" ry="6" fill="#e8906a" opacity="0.18" />
        <ellipse cx="126" cy="118" rx="9" ry="6" fill="#e8906a" opacity="0.18" />

        {/* Subtle chin / jaw shading */}
        <ellipse cx="100" cy="146" rx="18" ry="6" fill="#c08040" opacity="0.12" />
      </g>

      {/* ── GLASSES (premium look) ── */}
      <g transform={`translate(${headOff.x},${headOff.y})`} style={{ transition: "transform 0.18s ease-out" }}>
        <rect x="71" y="95" width="22" height="14" rx="5" fill="none" stroke="#2c2c2c" strokeWidth="1.5" />
        <rect x="107" y="95" width="22" height="14" rx="5" fill="none" stroke="#2c2c2c" strokeWidth="1.5" />
        <path d="M 93 102 L 107 102" stroke="#2c2c2c" strokeWidth="1.5" />
        <path d="M 62 99 L 71 100" stroke="#2c2c2c" strokeWidth="1.5" />
        <path d="M 129 100 L 138 99" stroke="#2c2c2c" strokeWidth="1.5" />
        <rect x="71" y="95" width="22" height="14" rx="5" fill="rgba(100,180,255,0.06)" />
        <rect x="107" y="95" width="22" height="14" rx="5" fill="rgba(100,180,255,0.06)" />
      </g>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   WAVEFORM — animated bars
═══════════════════════════════════════════════════════════ */
export function Waveform({ active }) {
  const bars = [0.3, 0.6, 1.0, 0.7, 0.9, 0.5, 0.8, 1.0, 0.6, 0.4, 0.7, 0.9, 0.5, 0.3, 0.8];
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: "3px", height: "40px",
    }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: "3px",
          height: active ? `${Math.max(4, h * 36)}px` : "4px",
          borderRadius: "2px",
          background: active
            ? `linear-gradient(to top, #7c3aed, #06b6d4)`
            : "rgba(99,102,241,0.25)",
          animation: active ? `waveBar 0.6s ease-in-out ${i * 0.05}s infinite alternate` : "none",
          transition: "height 0.25s ease, background 0.3s",
          boxShadow: active ? "0 0 6px rgba(124,58,237,0.5)" : "none",
        }} />
      ))}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.15); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BACKGROUND — animated fintech scene
═══════════════════════════════════════════════════════════ */
export function FintechBackground({ isSpeaking }) {
  return (
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit",
      background: "linear-gradient(135deg, #060818 0%, #0d0d2b 50%, #0a0f1e 100%)",
      zIndex: 0,
    }}>
      {/* Grid lines */}
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.07 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#7c3aed" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Glowing orbs */}
      <div style={{
        position: "absolute", width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
        top: "-80px", left: "-60px",
        animation: "orbMove 8s ease-in-out infinite alternate",
      }} />
      <div style={{
        position: "absolute", width: "250px", height: "250px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
        bottom: "-60px", right: "-40px",
        animation: "orbMove 10s ease-in-out infinite alternate-reverse",
      }} />

      {/* Glow pulse when speaking */}
      {isSpeaking && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.08) 0%, transparent 70%)",
          animation: "speakPulse 1.4s ease-in-out infinite alternate",
        }} />
      )}

      <style>{`
        @keyframes orbMove    { from{transform:translate(0,0)} to{transform:translate(20px,15px)} }
        @keyframes speakPulse { from{opacity:0.4} to{opacity:1} }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   KARAOKE TRANSCRIPT
═══════════════════════════════════════════════════════════ */
export function KaraokeTranscript({ words, currentWordIdx, isSpeaking, transcriptRef }) {
  useEffect(() => {
    if (currentWordIdx >= 0 && transcriptRef?.current) {
      const spans = transcriptRef.current.querySelectorAll("span[data-word]");
      if (spans[currentWordIdx]) {
        spans[currentWordIdx].scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [currentWordIdx]);

  if (!words.length) return null;

  return (
    <div ref={transcriptRef} style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(124,58,237,0.2)",
      borderRadius: "0.875rem",
      padding: "1rem 1.25rem",
      fontSize: "0.9rem",
      lineHeight: "1.9",
      maxHeight: "150px",
      overflowY: "auto",
      width: "100%",
      fontFamily: "Georgia, 'Times New Roman', serif",
      letterSpacing: "0.01em",
      scrollbarWidth: "thin",
      scrollbarColor: "#7c3aed transparent",
    }}>
      {words.map((word, i) => {
        const isActive = isSpeaking && i === currentWordIdx;
        const isPast   = i < currentWordIdx;
        return (
          <span key={i} data-word={i} style={{
            display: "inline",
            padding: "1px 3px",
            margin: "0 1px",
            borderRadius: "4px",
            transition: "background 0.1s, color 0.1s",
            background:  isActive ? "rgba(124,58,237,0.8)" : "transparent",
            color:       isActive ? "#fff" : isPast ? "#4b5680" : "#8892b0",
            fontWeight:  isActive ? 700 : 400,
            textShadow:  isActive ? "0 0 8px rgba(167,139,250,0.8)" : "none",
          }}>
            {word}{" "}
          </span>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LANG TOGGLE
═══════════════════════════════════════════════════════════ */
export function LangToggle({ lang, setLang }) {
  return (
    <div style={{
      display: "flex",
      background: "rgba(255,255,255,0.05)",
      borderRadius: "0.5rem",
      border: "1px solid rgba(124,58,237,0.3)",
      overflow: "hidden",
    }}>
      {[{ code: "en", label: "English" }, { code: "hi", label: "हिंदी" }].map(({ code, label }) => (
        <button key={code} onClick={() => setLang(code)} style={{
          padding: "0.4rem 1rem",
          fontSize: "0.8rem",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s",
          background: lang === code
            ? "linear-gradient(135deg, #7c3aed, #06b6d4)"
            : "transparent",
          color: lang === code ? "#fff" : "#64748b",
          letterSpacing: lang === code ? "0.02em" : "0",
        }}>{label}</button>
      ))}
    </div>
  );
}

/* Helper to strip all markdown/emoji from displayed text */
export function cleanText(text) {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{2B50}\u{2702}-\u{27B0}]/gu, "")
    .replace(/[#*`_~>•]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
