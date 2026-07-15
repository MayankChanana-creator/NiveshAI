// "use client";
// import useUser, { loginHref } from "@/lib/authClient";
// import starsBg from "@/assets/stars.png";
// import gridLines from "@/assets/grid-lines.png";
// import { motion, useMotionTemplate, useMotionValue, useScroll, useTransform } from "framer-motion";
// import { useEffect, useRef } from "react";
// import Link from "next/link";

// const useRelativeMousePosition = (to) => {
//   const mouseX = useMotionValue(0);
//   const mouseY = useMotionValue(0);

//   const updateMousePosition = (event) => {
//     if (!to.current) return;
//     const { top, left } = to.current.getBoundingClientRect();
//     mouseX.set(event.x - left);
//     mouseY.set(event.y - top);
//   };

//   useEffect(() => {
//     window.addEventListener("mousemove", updateMousePosition);
//     return () => {
//       window.removeEventListener("mousemove", updateMousePosition);
//     };
//   }, []);

//   return [mouseX, mouseY];
// };

// export const CallToAction = () => {
//   const sectionRef = useRef(null);
//   const borderedDivRef = useRef(null);

//   const { scrollYProgress } = useScroll({
//     target: sectionRef,
//     offset: ["start end", "end start"],
//   });

//   const backgroundPositionY = useTransform(scrollYProgress, [0, 1], [-300, 300]);
//   const [mouseX, mouseY] = useRelativeMousePosition(borderedDivRef);
//   const imageMask = useMotionTemplate`radial-gradient(50% 50% at ${mouseX}px ${mouseY}px, black, transparent)`;

//   return (
//     <section
//   ref={sectionRef}
//   className="min-h-screen flex items-center justify-center bg-black text-white pt-16 md:pt-20" // slightly less top padding
// >
//   <div className="container px-4">
//     <motion.div
//       ref={borderedDivRef}
//       className="relative cursor-grab border border-white/15 py-24 rounded-xl overflow-hidden group max-w-10xl mx-auto w-200%" // increased max-width
//       animate={{
//         backgroundPositionX: starsBg.width,
//       }}
//       transition={{
//         duration: 40,
//         ease: "linear",
//         repeat: Infinity,
//       }}
//       style={{
//         backgroundPositionY,
//         backgroundImage: `url(${starsBg.src})`,
//       }}
//     >
//       {/* Base layer */}
//       <div
//         className="absolute inset-0 bg-[rgb(74,32,138)] bg-blend-overlay [mask-image:radial-gradient(50%_50%_at_50%_35%,black,transparent)] group-hover:opacity-0 transition duration-700"
//         style={{
//           backgroundImage: `url(${gridLines.src})`,
//         }}
//       ></div>

//       {/* Hover layer */}
//       <motion.div
//         className="absolute inset-0 bg-[rgb(74,32,138)] bg-blend-overlay opacity-0 group-hover:opacity-100"
//         style={{
//           maskImage: imageMask,
//           backgroundImage: `url(${gridLines.src})`,
//         }}
//       ></motion.div>

//       {/* Text + Button */}
//       <div className="relative text-center">
//         <h2 className="text-5xl md:text-6xl font-medium tracking-tighter max-w-3xl mx-auto">
//           Empower Your Financial Future with WealthPulse
//         </h2>
//  <p className="text-lg text-gray-300 max-w-2xl mb-8 mt-6 mx-auto text-center">
//   Unleash your financial potential with WealthPulse
//   <br />
//   <span className="italic">
//     your AI-powered investment companion.
//   </span>
// </p>


//         <div>
//           {(() => {
//             const { isSignedIn } = useUser();
//             return isSignedIn ? (
//               <Link href="/Portfolio" className="inline-flex items-center gap-3 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-[1.02] transition-transform">
//                 Get Started
//                 <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">→</span>
//               </Link>
//             ) : (
//               <a href={`${loginHref}?screen_hint=signup`} className="inline-flex items-center gap-3 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-[1.02] transition-transform">
//                 Get Started
//                 <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">→</span>
//               </a>
//             );
//           })()}
//         </div>
//       </div>
//     </motion.div>
//   </div>
// </section>

//   );
// };

// "use client";

// import useUser, { loginHref } from "@/lib/authClient";
// import starsBg from "@/assets/stars.png";
// import gridLines from "@/assets/grid-lines.png";
// import {
//   motion,
//   AnimatePresence,
//   useMotionTemplate,
//   useMotionValue,
//   useScroll,
//   useTransform,
// } from "framer-motion";
// import { useEffect, useRef, useState } from "react";
// import Link from "next/link";

// /* Animated heading lines */
// const headingLines = [
//   "NiveshAI — Bridging India’s Financial Gap",
//   "AI-Powered Insights for Smarter Investing",
//   "Understand Your Money, Not Just Track It",
//   "One Platform for Stocks, Funds & Crypto",
//   "Built for Long-Term Indian Investors",
// ];

// export const CallToAction = () => {
//   const sectionRef = useRef(null);
//   const borderedDivRef = useRef(null);
//   const { isSignedIn } = useUser();
//   const [lineIndex, setLineIndex] = useState(0);

//   useEffect(() => {
//     const i = setInterval(
//       () => setLineIndex((p) => (p + 1) % headingLines.length),
//       3200
//     );
//     return () => clearInterval(i);
//   }, []);

//   const { scrollYProgress } = useScroll({
//     target: sectionRef,
//     offset: ["start end", "end start"],
//   });

//   const backgroundPositionY = useTransform(scrollYProgress, [0, 1], [-300, 300]);
//   const mouseX = useMotionValue(0);
//   const mouseY = useMotionValue(0);

//   const imageMask = useMotionTemplate`
//     radial-gradient(45% 45% at ${mouseX}px ${mouseY}px, black, transparent)
//   `;

//   return (
//     <section
//       ref={sectionRef}
//       className="min-h-screen flex items-center justify-center bg-slate-200 pt-20"
//     >
//       <div className="container px-4">
//         <motion.div
//           ref={borderedDivRef}
//           className="
//             relative overflow-hidden rounded-2xl border border-white/10
//             bg-gradient-to-br from-slate-900 via-blue-900 to-sky-700
//             py-28 max-w-6xl mx-auto group
//           "
//           animate={{ backgroundPositionX: starsBg.width }}
//           transition={{ duration: 40, ease: "linear", repeat: Infinity }}
//           style={{
//             backgroundImage: `url(${starsBg.src})`,
//             backgroundPositionY,
//           }}
//         >
//           {/* DARK GRADIENT TINT */}
//           <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/90 to-sky-700/90" />

//           {/* GRID — ALWAYS VISIBLE */}
//           <div
//             className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-85"
//             style={{ backgroundImage: `url(${gridLines.src})` }}
//           />

//           {/* HOVER GRID FOCUS */}
//           <motion.div
//             className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
//             style={{
//               maskImage: imageMask,
//               backgroundImage: `url(${gridLines.src})`,
//             }}
//           />

//           {/* CONTENT */}
//           <div className="relative text-center px-6">
//             <div className="h-[5.5rem] overflow-hidden">
//               <AnimatePresence mode="wait">
//                 <motion.h2
//                   key={lineIndex}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -20 }}
//                   transition={{ duration: 0.4 }}
//                   className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl mx-auto text-white"
//                 >
//                   {headingLines[lineIndex].split(" ").map((w, i) => (
//                     <motion.span
//                       key={i}
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       transition={{ delay: i * 0.08 }}
//                       className="inline-block mr-2"
//                     >
//                       {w}
//                     </motion.span>
//                   ))}
//                 </motion.h2>
//               </AnimatePresence>
//             </div>

//             <p className="text-base md:text-lg text-sky-100 max-w-2xl mt-6 mb-10 mx-auto">
//               Visualize, analyze, and grow your wealth using intelligent
//               insights designed for Indian investors.
//             </p>

//             {isSignedIn ? (
//               <Link
//                 href="/Portfolio"
//                 className="inline-flex items-center gap-3 bg-white text-blue-900 font-semibold px-7 py-3 rounded-full hover:bg-sky-100 transition"
//               >
//                 Open Portfolio →
//               </Link>
//             ) : (
//               <a
//                 href={`${loginHref}?screen_hint=signup`}
//                 className="inline-flex items-center gap-3 bg-white text-blue-900 font-semibold px-7 py-3 rounded-full hover:bg-sky-100 transition"
//               >
//                 Get Started →
//               </a>
//             )}
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// };


// "use client";

// import useUser, { loginHref } from "@/lib/authClient";
// import starsBg from "@/assets/stars.png";
// import gridLines from "@/assets/grid-lines.png";
// import {
//   motion,
//   AnimatePresence,
//   useMotionTemplate,
//   useMotionValue,
//   useScroll,
//   useTransform,
// } from "framer-motion";
// import { useEffect, useRef, useState } from "react";
// import Link from "next/link";

// /* Animated heading lines */
// const headingLines = [
//   "NiveshAI — Bridging India’s Financial Gap",
//   "AI-Powered Insights for Smarter Investing",
//   "Understand Your Money, Not Just Track It",
//   "One Platform for Stocks, Funds & Crypto",
//   "Built for Long-Term Indian Investors",
// ];

// export const CallToAction = () => {
//   const sectionRef = useRef(null);
//   const borderedDivRef = useRef(null);
//   const { isSignedIn } = useUser();
//   const [lineIndex, setLineIndex] = useState(0);

//   useEffect(() => {
//     const i = setInterval(
//       () => setLineIndex((p) => (p + 1) % headingLines.length),
//       3200
//     );
//     return () => clearInterval(i);
//   }, []);

//   const { scrollYProgress } = useScroll({
//     target: sectionRef,
//     offset: ["start end", "end start"],
//   });

//   const backgroundPositionY = useTransform(scrollYProgress, [0, 1], [-300, 300]);
//   const mouseX = useMotionValue(0);
//   const mouseY = useMotionValue(0);

//   const imageMask = useMotionTemplate`
//     radial-gradient(45% 45% at ${mouseX}px ${mouseY}px, black, transparent)
//   `;

//   return (
//     <section
//       ref={sectionRef}
//       className="min-h-screen flex items-center justify-center bg-slate-200 pt-20"
//     >
//       <div className="w-full px-4 flex justify-center">
//         <motion.div
//           ref={borderedDivRef}
//           className="
//             relative overflow-hidden
//             w-full max-w-7xl
//             min-h-[80vh]
//             flex items-center justify-center
//             rounded-2xl
//             border border-white/10
//             bg-gradient-to-br from-slate-900 via-blue-900 to-sky-700
//             group
//           "
//           animate={{ backgroundPositionX: starsBg.width }}
//           transition={{ duration: 40, ease: "linear", repeat: Infinity }}
//           style={{
//             backgroundImage: `url(${starsBg.src})`,
//             backgroundPositionY,
//           }}
//         >
//           {/* DARK GRADIENT TINT */}
//           <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/90 to-sky-700/90" />

//           {/* GRID — ALWAYS VISIBLE */}
//           <div
//             className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-85"
//             style={{ backgroundImage: `url(${gridLines.src})` }}
//           />

//           {/* HOVER GRID FOCUS */}
//           <motion.div
//             className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
//             style={{
//               maskImage: imageMask,
//               backgroundImage: `url(${gridLines.src})`,
//             }}
//           />

//           {/* CONTENT */}
//           <div className="relative text-center px-6 max-w-4xl">
//             <div className="h-[5.5rem] overflow-hidden">
//               <AnimatePresence mode="wait">
//                 <motion.h2
//                   key={lineIndex}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -20 }}
//                   transition={{ duration: 0.4 }}
//                   className="text-4xl md:text-5xl font-semibold tracking-tight text-white"
//                 >
//                   {headingLines[lineIndex].split(" ").map((w, i) => (
//                     <motion.span
//                       key={i}
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       transition={{ delay: i * 0.08 }}
//                       className="inline-block mr-2"
//                     >
//                       {w}
//                     </motion.span>
//                   ))}
//                 </motion.h2>
//               </AnimatePresence>
//             </div>

//             <p className="text-base md:text-lg text-sky-100 mt-6 mb-10">
//               Visualize, analyze, and grow your wealth using intelligent
//               insights designed for Indian investors.
//             </p>

//             {isSignedIn ? (
//               <Link
//                 href="/Portfolio"
//                 className="inline-flex items-center gap-3 bg-white text-blue-900 font-semibold px-7 py-3 rounded-full hover:bg-sky-100 transition"
//               >
//                 Open Portfolio →
//               </Link>
//             ) : (
//               <a
//                 href={`${loginHref}?screen_hint=signup`}
//                 className="inline-flex items-center gap-3 bg-white text-blue-900 font-semibold px-7 py-3 rounded-full hover:bg-sky-100 transition"
//               >
//                 Get Started →
//               </a>
//             )}
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// };

"use client";

import useUser, { loginHref } from "@/lib/authClient";
import starsBg from "@/assets/stars.png";
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* Animated heading lines */
const headingLines = [
  "NiveshAI — Bridging India’s Financial Gap",
  "AI-Powered Insights for Smarter Investing",
  "Understand Your Money, Not Just Track It",
  "One Platform for Stocks, Funds & Crypto",
  "Built for Long-Term Indian Investors",
];

/* Top stock ticker (Initial data) */
const initialStocks = [
  { name: "NIFTY 50", rawPrice: 22530.0, rawChange: 0.62 },
  { name: "SENSEX", rawPrice: 74180.0, rawChange: 0.55 },
  { name: "RELIANCE", rawPrice: 2934.0, rawChange: 1.14 },
  { name: "HDFC", rawPrice: 1485.0, rawChange: -0.21 },
  { name: "TCS", rawPrice: 3982.0, rawChange: 0.48 },
];

/* Bottom Bitcoin ticker (Initial data) */
const initialCrypto = [
  { label: "BTC", rawValue: 64280.0, prefix: "$", suffix: "", color: "text-orange-400" },
  { label: "24H", rawValue: 1.92, prefix: "+", suffix: "%", color: "text-green-400" },
  { label: "MARKET CAP", rawValue: 1.26, prefix: "$", suffix: "T", color: "text-sky-300" },
  { label: "DOMINANCE", rawValue: 52.4, prefix: "", suffix: "%", color: "text-cyan-300" },
  { label: "VOLUME", rawValue: 28.3, prefix: "$", suffix: "B", color: "text-purple-300" },
];

const AnimatedNumber = ({ value }) => (
  <span className="relative inline-flex overflow-hidden tabular-nums align-middle" style={{ height: "1.2em", lineHeight: "1.2em" }}>
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: "0%", opacity: 1 }}
        exit={{ y: "-100%", opacity: 0, position: "absolute" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </span>
);

export const CallToAction = () => {
  const sectionRef = useRef(null);
  const borderedDivRef = useRef(null);
  const { isSignedIn } = useUser();
  const [lineIndex, setLineIndex] = useState(0);

  // Dynamic Ticker states
  const [stocks, setStocks] = useState(initialStocks);
  const [crypto, setCrypto] = useState(initialCrypto);

  /* Randomly update ticker prices */
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prev) => prev.map(stock => {
        const volatility = (Math.random() - 0.5) * 0.0015; // +/- 0.075% change per tick
        const newPrice = stock.rawPrice * (1 + volatility);
        const changeDiff = ((newPrice - stock.rawPrice) / stock.rawPrice) * 100;
        return {
          ...stock,
          rawPrice: newPrice,
          rawChange: stock.rawChange + changeDiff
        };
      }));

      setCrypto((prev) => prev.map(item => {
        // Only modify BTC price, 24H and Dominance dynamically
        if (item.label === "MARKET CAP" || item.label === "VOLUME") return item;
        const volatility = (Math.random() - 0.5) * 0.003;
        return {
          ...item,
          rawValue: item.rawValue * (1 + volatility)
        };
      }));
    }, 1500); // UI updates every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  // Number format helper
  const formatNum = (num, min = 0, max = 2) => num.toLocaleString('en-IN', { minimumFractionDigits: min, maximumFractionDigits: max });

  /* Rotate heading lines */
  useEffect(() => {
    const i = setInterval(
      () => setLineIndex((p) => (p + 1) % headingLines.length),
      3200
    );
    return () => clearInterval(i);
  }, []);

  /* Scroll parallax */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const backgroundPositionY = useTransform(scrollYProgress, [0, 1], [-300, 300]);

  /* Mouse spotlight */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const onMouseMove = (e) => {
    if (!borderedDivRef.current) return;
    const rect = borderedDivRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const spotlightMask = useMotionTemplate`
    radial-gradient(260px 260px at ${mouseX}px ${mouseY}px, black, transparent 65%)
  `;

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center bg-slate-200 pt-20"
    >
      <div className="w-full px-4 flex justify-center">
        <motion.div
          ref={borderedDivRef}
          onMouseMove={onMouseMove}
          className="relative overflow-hidden w-full max-w-7xl min-h-[80vh] flex flex-col rounded-2xl border border-white/10 group"
        >
          {/* 🔝 TOP STOCK TICKER */}
          <div className="relative z-20 w-full h-16 overflow-hidden bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center">
            <motion.div
              className="flex items-center gap-12 whitespace-nowrap px-8"
              animate={{ x: ["0%", "-100%"] }}
              transition={{ duration: 28, ease: "linear", repeat: Infinity }}
            >
              {[...stocks, ...stocks].map((item, i) => {
                const isPositive = item.rawChange >= 0;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-lg font-semibold text-sky-100"
                  >
                    <span className="text-cyan-300 font-bold">{item.name}</span>
                    <AnimatedNumber value={formatNum(item.rawPrice)} />
                    <span className={`inline-flex items-center gap-0.5 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                      <span>{isPositive ? "+" : ""}</span>
                      <AnimatedNumber value={formatNum(item.rawChange, 2, 2)} />
                      <span>%</span>
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* 🌊 ANIMATED BLUE BACKGROUND */}
          <motion.div
            className="absolute inset-0 z-0"
            animate={{
              background: [
                "linear-gradient(120deg, #020617, #0f172a, #1e3a8a)",
                "linear-gradient(120deg, #020617, #1e40af, #0284c7)",
                "linear-gradient(120deg, #020617, #0369a1, #38bdf8)",
                "linear-gradient(120deg, #020617, #1d4ed8, #0ea5e9)",
              ],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* ⭐ Stars */}
          <motion.div
            className="absolute inset-0 opacity-50"
            animate={{ backgroundPositionX: starsBg.width }}
            transition={{ duration: 40, ease: "linear", repeat: Infinity }}
            style={{
              backgroundImage: `url(${starsBg.src})`,
              backgroundRepeat: "repeat",
              backgroundPositionY,
            }}
          />

          {/* 🔵 Dot Grid */}
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(125,211,252,0.85) 1.6px, transparent 1.6px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* ✨ Hover Effects */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
            style={{
              maskImage: spotlightMask,
              backgroundImage:
                "radial-gradient(circle, rgba(186,230,253,1) 2px, transparent 2px)",
              backgroundSize: "18px 18px",
            }}
          />

          {/* 🧠 CENTER CONTENT */}
          <div className="relative z-10 flex-1 flex items-center justify-center text-center px-6">
            <div className="max-w-4xl w-full">
              {/* ✅ FIXED HEADING CONTAINER */}
              <div className="min-h-[7.5rem] md:min-h-[9rem] flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={lineIndex}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="
                      text-4xl md:text-5xl lg:text-6xl
                      font-semibold
                      text-white
                      leading-tight
                      text-center
                      px-4
                    "
                  >
                    {headingLines[lineIndex].split(" ").map((word, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className="inline-block mr-3"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </motion.h2>
                </AnimatePresence>
              </div>

              <p className="text-lg md:text-xl text-sky-100 mt-6 mb-10">
                Visualize, analyze, and grow your wealth using intelligent
                insights designed for Indian investors.
              </p>

              {isSignedIn ? (
                <Link
                  href="/Portfolio"
                  className="inline-flex items-center gap-3 bg-white text-blue-900 font-semibold px-8 py-4 rounded-full hover:bg-sky-100 transition"
                >
                  Open Portfolio →
                </Link>
              ) : (
                <a
                  href={`${loginHref}?screen_hint=signup`}
                  className="inline-flex items-center gap-3 bg-white text-blue-900 font-semibold px-8 py-4 rounded-full hover:bg-sky-100 transition"
                >
                  Get Started →
                </a>
              )}
            </div>
          </div>

          {/* 🔻 BOTTOM BITCOIN TICKER */}
          <div className="relative z-20 w-full h-16 overflow-hidden bg-black/40 backdrop-blur-md border-t border-white/10 flex items-center">
            <motion.div
              className="flex items-center gap-14 whitespace-nowrap px-8"
              animate={{ x: ["-100%", "0%"] }}
              transition={{ duration: 26, ease: "linear", repeat: Infinity }}
            >
              {[...crypto, ...crypto].map((item, i) => {
                const formattedVal = item.label === "BTC" || item.label === "MARKET CAP" || item.label === "VOLUME"
                  ? formatNum(item.rawValue, 0, 2)
                  : formatNum(item.rawValue, 2, 2);

                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-xl font-semibold"
                  >
                    <span className="text-orange-400 font-bold">₿</span>
                    <span className="text-sky-200">{item.label}</span>
                    <span className={`inline-flex items-center gap-0.5 ${item.label === "24H" ? (item.rawValue >= 0 ? "text-green-400" : "text-red-400") : item.color}`}>
                      <span>{item.label === "24H" ? (item.rawValue >= 0 ? "+" : "") : item.prefix}</span>
                      <AnimatedNumber value={formattedVal} />
                      <span>{item.suffix}</span>
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
