"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const languages = [
  { name: "தமிழ்", english: "Tamil", image: "/landmark_tamil.png", bgColor: "#fef2f2", textColor: "#b91c1c", borderColor: "#fca5a5" },
  { name: "मराठी", english: "Marathi", image: "/landmark_marathi.png", bgColor: "#f0fdf4", textColor: "#15803d", borderColor: "#86efac" },
  { name: "हिंदी", english: "Hindi", image: "/landmark_hindi.png", bgColor: "#f5f3ff", textColor: "#6d28d9", borderColor: "#c4b5fd" },
  { name: "తెలుగు", english: "Telugu", image: "/landmark_telugu.png", bgColor: "#fdf2f8", textColor: "#be185d", borderColor: "#f9a8d4" },
  { name: "മലയാളം", english: "Malayalam", image: "/landmark_malayalam.png", bgColor: "#f0fdfa", textColor: "#0f766e", borderColor: "#5eead4" },
  { name: "ગુજરાતી", english: "Gujarati", image: "/landmark_gujarati.png", bgColor: "#fff7ed", textColor: "#c2410c", borderColor: "#fdba74" },
  { name: "ಕನ್ನಡ", english: "Kannada", image: "/landmark_kannada.png", bgColor: "#eff6ff", textColor: "#1d4ed8", borderColor: "#93c5fd" },
  { name: "ਪੰਜਾਬੀ", english: "Punjabi", image: "/landmark_punjabi.png", bgColor: "#fffbeb", textColor: "#b45309", borderColor: "#fcd34d" },
];

export default function MultilingualCarousel() {
  const [globalAngle, setGlobalAngle] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dimensions, setDimensions] = useState({ rx: 450, rz: 180 });
  const animRef = useRef(null);
  const rotRef = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Responsive ellipse radii based on screen width
      setDimensions({
        rx: Math.min(width * 0.4, 550), // Spread horizontally
        rz: Math.min(width * 0.15, 200), // Spread in depth
      });
    };

    // Set initial size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const speed = 0.0035; // Continuous rads per frame

    const tick = () => {
      if (!isPaused) {
        rotRef.current += speed;
        setGlobalAngle(rotRef.current);
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPaused]);

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-slate-950 via-[#020b1f] to-[#010614]">
      {/* Background ambient light */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse,rgba(56,189,248,0.07),transparent_60%)]" />
      </div>

      <div className="relative z-10 text-center mb-16 px-6">
        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium border border-sky-400/30 text-sky-300 bg-sky-400/10 mb-5 shadow-lg shadow-sky-500/10">
          Multilingual Support
        </span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
          Invest in your{" "}
          <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
            language
          </span>
        </h2>
        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
          NiveshAI speaks the language you think in — making finance accessible across India.
        </p>
      </div>

      {/* 3D Mathematical Curved Carousel */}
      <div
        className="relative h-[480px] w-full max-w-[1400px] mx-auto flex justify-center items-center perspective-[1500px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {languages.map((lang, i) => {
          // Spread cards evenly around the 2PI circle
          const cardAngle = globalAngle + (i / languages.length) * Math.PI * 2;

          // Calculate X and Z positions forming an ellipse
          const x = Math.sin(cardAngle) * dimensions.rx;
          const z = Math.cos(cardAngle) * dimensions.rz;

          // Normalize Z from 0 (backwards) to 1 (frontwards)
          const normalizedZ = (z + dimensions.rz) / (dimensions.rz * 2);

          // Map Z to visual properties
          const scale = 0.6 + 0.45 * normalizedZ;       // Distant cards are smaller
          const opacity = 0.25 + 0.75 * normalizedZ;   // Distant cards are faded
          const zIndex = Math.round(normalizedZ * 100); // Front cards overlap back cards

          // Optional: Cards slightly angle inwards towards the user like an amphitheater
          const rotateY = -Math.sin(cardAngle) * 40;

          return (
            <div
              key={lang.english}
              className="absolute top-1/2 left-1/2 -mt-[170px] -ml-[130px] w-[260px] group cursor-pointer"
              style={{
                // Apply the math to actual 3D transforms
                transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
                transformStyle: 'preserve-3d',
                // Using will-change to optimize requestAnimationFrame repaints
                willChange: "transform, opacity",
              }}
            >
              {/* Inner container handles hover scales uniquely to preserve mathematically transformed outer shell */}
              <div
                className="rounded-3xl overflow-hidden border border-white/20 transition-all duration-400 group-hover:-translate-y-4 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.6)] group-hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] relative"
                style={{
                  backgroundColor: lang.bgColor,
                  borderColor: lang.borderColor,
                }}
              >
                {/* Colored overlay sheen on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-400 pointer-events-none"
                  style={{ backgroundColor: lang.textColor }}
                />

                <div className="pt-7 pb-4 px-4 text-center border-b border-black/5 relative z-10">
                  <h3 className="text-4xl font-extrabold tracking-tight" style={{ color: lang.textColor }}>
                    {lang.name}
                  </h3>
                  <p className="text-sm uppercase font-bold mt-2 tracking-widest opacity-60" style={{ color: lang.textColor }}>
                    {lang.english}
                  </p>
                </div>

                <div className="p-3 bg-white/40 relative z-10 backdrop-blur-sm">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#ffffff] border border-black/5 shadow-inner">
                    <img
                      src={lang.image}
                      alt={`${lang.english} landmark`}
                      className="w-full h-full object-contain p-3 mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.15]"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Curved glowing floor base line underneath the carousel */}
      <div className="relative z-10 mx-auto max-w-4xl px-10">
        <div className="h-10 w-full rounded-[100%] mx-auto bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.2)_0%,transparent_60%)] blur-xl" />
        <div className="h-2 w-2/3 mt-[-20px] rounded-[100%] mx-auto border-t border-sky-500/20 shadow-[0_-5px_20px_rgba(56,189,248,0.3)]" />
      </div>
    </section>
  );
}
