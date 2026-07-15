"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";

/* ═══════════════════════════════════════════════════════════
   PREMIUM 3D AVATAR — Full-body animated character
   Multi-pose sprite animation with:
     ✦ 4 pose frames — idle, right gesture, left gesture, both hands
     ✦ Smooth cross-fade transitions between poses while speaking
     ✦ Subtle body sway & breathing while idle
     ✦ Dynamic glow ring, particle aura, floor reflection
     ✦ Mouse-tracking parallax
     ✦ Speaking equalizer bar overlay
═══════════════════════════════════════════════════════════ */

// Video options for randomized playback
const VIDEO_OPTIONS = [
  "/avatar_vid/av_final.mp4",
  "/avatar_vid/av2.mov",
  "/avatar_vid/av3.mov"
];

// ── Animated particle aura canvas ────────────────────────
function ParticleAura({ isSpeaking, width, height }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const count = isSpeaking ? 55 : 25;
    particles.current = Array.from({ length: count }, () => ({
      x: width / 2 + (Math.random() - 0.5) * width * 0.9,
      y: height * 0.3 + Math.random() * height * 0.7,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.6 - 0.15,
      size: Math.random() * 2.5 + 0.8,
      opacity: Math.random() * 0.5 + 0.15,
      hue: Math.random() > 0.5
        ? Math.random() * 40 + 35   // golden range
        : Math.random() * 50 + 255, // purple-blue range
      life: Math.random() * 120,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.current.forEach((p) => {
        p.life += 0.6;
        p.x += p.vx + Math.sin(p.life * 0.025) * 0.25;
        p.y += p.vy;
        p.opacity -= 0.0018;

        if (p.opacity <= 0 || p.y < -10) {
          p.x = width / 2 + (Math.random() - 0.5) * width * 0.7;
          p.y = height * 0.85 + Math.random() * height * 0.15;
          p.opacity = Math.random() * (isSpeaking ? 0.7 : 0.4) + 0.15;
          p.vy = -Math.random() * (isSpeaking ? 1.0 : 0.4) - 0.15;
          p.size = Math.random() * (isSpeaking ? 3.5 : 2) + 0.8;
        }

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5);
        g.addColorStop(0, `hsla(${p.hue}, 75%, 70%, ${p.opacity})`);
        g.addColorStop(0.5, `hsla(${p.hue}, 65%, 60%, ${p.opacity * 0.3})`);
        g.addColorStop(1, `hsla(${p.hue}, 55%, 50%, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 88%, ${p.opacity * 1.2})`;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isSpeaking, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: `${width}px`, height: `${height}px`,
        pointerEvents: "none", zIndex: 2,
      }}
    />
  );
}


// ── Floor reflection gradient ────────────────────────────
function FloorReflection({ width, isSpeaking }) {
  return (
    <div style={{
      position: "absolute",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: `${width * 0.65}px`,
      height: "60px",
      background: isSpeaking
        ? "radial-gradient(ellipse at 50% 0%, rgba(226,179,64,0.18) 0%, rgba(124,58,237,0.06) 50%, transparent 100%)"
        : "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 70%)",
      borderRadius: "50%",
      filter: "blur(8px)",
      zIndex: 1,
      transition: "background 0.5s",
      pointerEvents: "none",
    }} />
  );
}


// ── Speaking equalizer bars ──────────────────────────────
function SpeakingEqualizer({ active }) {
  const barCount = 11;
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      gap: "2.5px", height: "28px",
      opacity: active ? 1 : 0,
      transition: "opacity 0.3s",
      position: "absolute",
      bottom: "18px", left: "50%", transform: "translateX(-50%)",
      zIndex: 10,
    }}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div key={i} style={{
          width: "3px",
          borderRadius: "1.5px",
          background: `linear-gradient(to top, #e2b340, #f5d060)`,
          animation: active
            ? `eqBar 0.3s ease-in-out ${i * 0.035}s infinite alternate`
            : "none",
          height: active ? "3px" : "2px",
          boxShadow: active ? "0 0 5px rgba(226,179,64,0.5)" : "none",
          transition: "height 0.15s",
        }} />
      ))}
    </div>
  );
}


// ── Name tag ─────────────────────────────────────────────
function AvatarNameTag({ isSpeaking }) {
  return (
    <div style={{
      position: "absolute",
      bottom: "4px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10,
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 14px",
      borderRadius: "20px",
      background: "rgba(10,15,46,0.75)",
      border: `1px solid ${isSpeaking ? "rgba(226,179,64,0.3)" : "rgba(124,58,237,0.2)"}`,
      backdropFilter: "blur(6px)",
      transition: "border-color 0.4s",
    }}>
      {isSpeaking && (
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "#34d399",
          boxShadow: "0 0 6px #34d399",
          animation: "dotBlink 1s infinite",
          display: "inline-block",
        }} />
      )}
      <span style={{
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: isSpeaking ? "#e2b340" : "#64748b",
        transition: "color 0.4s",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}>
        AI Dost
      </span>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
//   MAIN EXPORTED COMPONENT
// ═══════════════════════════════════════════════════════════
export function PremiumAvatar3D({ isSpeaking = false, size = 420, audioRef = null }) {
  const containerRef = useRef(null);
  const [mouseOff, setMouseOff] = useState({ x: 0, y: 0 });
  const videoRef = useRef(null);

  // No video on mount. Only pick one when speaking starts.
  const [currentVideoSrc, setCurrentVideoSrc] = useState(null);

  // ── Sync video with audio ──
  useEffect(() => {
    let syncInterval;

    if (isSpeaking) {
      if (!currentVideoSrc) {
        setCurrentVideoSrc(VIDEO_OPTIONS[Math.floor(Math.random() * VIDEO_OPTIONS.length)]);
      }

      if (videoRef.current) {
        videoRef.current.play().catch(() => {});

        syncInterval = setInterval(() => {
          if (audioRef && audioRef.current && videoRef.current) {
            const aTime = audioRef.current.currentTime;
            const vTime = videoRef.current.currentTime;
            const vDur = videoRef.current.duration;
            
            if (vDur > 0) {
              const targetTime = aTime % vDur;
              if (Math.abs(vTime - targetTime) > 0.3) {
                videoRef.current.currentTime = targetTime;
              }
              if (videoRef.current.paused) {
                 videoRef.current.play().catch(() => {});
              }
            }
          }
        }, 500);
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setCurrentVideoSrc(null);
    }

    return () => clearInterval(syncInterval);
  }, [isSpeaking, audioRef, currentVideoSrc]);

  // ── Mouse parallax ──
  const handleMouse = useCallback((e) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    setMouseOff({
      x: ((e.clientX - cx) / r.width) * 4,
      y: ((e.clientY - cy) / r.height) * 3,
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [handleMouse]);

  const imgH = size * 1.15; // taller than wide for full body

  return (
    <div
      ref={containerRef}
      style={{
        width: `${size}px`,
        height: `${imgH}px`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      }}
    >
      {/* ── Background glow / spotlight ── */}
      <div style={{
        position: "absolute",
        width: `${size * 0.85}px`,
        height: `${imgH * 0.5}px`,
        top: "15%",
        left: "50%",
        transform: "translateX(-50%)",
        borderRadius: "50%",
        background: isSpeaking
          ? "radial-gradient(ellipse, rgba(226,179,64,0.10) 0%, rgba(124,58,237,0.06) 40%, transparent 70%)"
          : "radial-gradient(ellipse, rgba(124,58,237,0.05) 0%, transparent 60%)",
        filter: "blur(20px)",
        zIndex: 0,
        transition: "background 0.6s",
        pointerEvents: "none",
      }} />

      {/* ── Outer spinning gradient ring ── */}
      <div style={{
        position: "absolute",
        width: `${size * 0.72}px`,
        height: `${size * 0.72}px`,
        top: "6%",
        left: "50%",
        transform: "translateX(-50%)",
        borderRadius: "50%",
        background: isSpeaking
          ? "conic-gradient(from 0deg, #7c3aed, #06b6d4, #e2b340, #7c3aed)"
          : "conic-gradient(from 0deg, rgba(124,58,237,0.2), rgba(6,182,212,0.15), rgba(124,58,237,0.2))",
        animation: isSpeaking
          ? "avatarRingSpin 2.5s linear infinite"
          : "avatarRingSpin 15s linear infinite",
        zIndex: 1,
        filter: isSpeaking ? "blur(2px)" : "blur(3px)",
        opacity: isSpeaking ? 0.7 : 0.35,
        transition: "opacity 0.5s, filter 0.5s",
        pointerEvents: "none",
      }} />

      {/* ── Particles ── */}
      <ParticleAura isSpeaking={isSpeaking} width={size} height={imgH} />

      {/* ── Avatar image layers ── */}
      <div style={{
        position: "relative",
        width: `${size * 0.88}px`,
        height: `${imgH * 0.92}px`,
        zIndex: 5,
        transform: `perspective(1000px) rotateY(${mouseOff.x * 0.25}deg) rotateX(${-mouseOff.y * 0.2}deg)`,
        transition: "transform 0.12s ease-out",
        animation: isSpeaking
          ? "avatarSpeakSway 3s ease-in-out infinite"
          : "avatarIdleBreathe 5s ease-in-out infinite",
      }}>
        {/* Placeholder when idle */}
        {!currentVideoSrc && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "rgba(10,15,46,0.5)",
            borderRadius: "1.5rem",
            border: "2px solid rgba(124,58,237,0.2)",
            zIndex: 2,
            backdropFilter: "blur(5px)",
          }}>
            <div style={{
               width: "70px", height: "70px", borderRadius: "50%",
               background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
               animation: "haloPulse 2s infinite alternate",
               marginBottom: "1rem"
            }} />
            <span style={{ color: "#e2b340", fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI Dost</span>
            <span style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.4rem" }}>Ready to assist</span>
          </div>
        )}

        {/* Video layer — only rendered when a source is available */}
        {currentVideoSrc && (
          <video
            ref={videoRef}
            src={currentVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              borderRadius: "1.5rem",
              border: isSpeaking ? "2px solid rgba(226,179,64,0.4)" : "none",
              filter: isSpeaking
                ? "brightness(1.06) saturate(1.08) drop-shadow(0 8px 25px rgba(0,0,0,0.5))"
                : "none",
              transition: "filter 0.4s, border 0.4s, opacity 0.4s",
              zIndex: 1,
            }}
          />
        )}

        {/* Rim light overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: isSpeaking
            ? "linear-gradient(120deg, rgba(226,179,64,0.06) 0%, transparent 35%, transparent 65%, rgba(6,182,212,0.05) 100%)"
            : "linear-gradient(120deg, rgba(255,255,255,0.03) 0%, transparent 40%)",
          pointerEvents: "none",
          zIndex: 3,
          transition: "background 0.5s",
        }} />
      </div>

      {/* ── Floor reflection ── */}
      <FloorReflection width={size} isSpeaking={isSpeaking} />

      {/* ── Speaking equalizer ── */}
      <SpeakingEqualizer active={isSpeaking} />

      {/* ── Pulsing halo rings when speaking ── */}
      {isSpeaking && (
        <>
          <div style={{
            position: "absolute",
            width: `${size * 0.65}px`,
            height: `${size * 0.65}px`,
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            borderRadius: "50%",
            border: "1.5px solid rgba(226,179,64,0.2)",
            animation: "haloPulse 2.2s ease-in-out infinite",
            zIndex: 0,
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute",
            width: `${size * 0.78}px`,
            height: `${size * 0.78}px`,
            top: "3%",
            left: "50%",
            transform: "translateX(-50%)",
            borderRadius: "50%",
            border: "1px solid rgba(124,58,237,0.12)",
            animation: "haloPulse 2.2s ease-in-out 0.6s infinite",
            zIndex: 0,
            pointerEvents: "none",
          }} />
        </>
      )}

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes avatarRingSpin {
          from { transform: translateX(-50%) rotate(0deg); }
          to   { transform: translateX(-50%) rotate(360deg); }
        }
        @keyframes avatarSpeakSway {
          0%, 100% {
            transform: perspective(1000px) translateY(0px) rotateY(0deg) scale(1);
          }
          20% {
            transform: perspective(1000px) translateY(-5px) rotateY(1.5deg) scale(1.008);
          }
          45% {
            transform: perspective(1000px) translateY(-8px) rotateY(-1deg) scale(1.012);
          }
          70% {
            transform: perspective(1000px) translateY(-4px) rotateY(1deg) scale(1.005);
          }
        }
        @keyframes avatarIdleBreathe {
          0%, 100% {
            transform: perspective(1000px) translateY(0px) scale(1);
          }
          50% {
            transform: perspective(1000px) translateY(-4px) scale(1.005);
          }
        }
        @keyframes poseFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes haloPulse {
          0%   { transform: translateX(-50%) scale(0.96); opacity: 0.5; }
          50%  { transform: translateX(-50%) scale(1.06); opacity: 0.15; }
          100% { transform: translateX(-50%) scale(0.96); opacity: 0.5; }
        }
        @keyframes eqBar {
          from { height: 3px; }
          to   { height: 22px; }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

export default PremiumAvatar3D;
