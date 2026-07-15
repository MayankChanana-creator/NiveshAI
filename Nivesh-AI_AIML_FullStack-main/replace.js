const fs = require('fs');

const file = '/Users/vishalgautam/Downloads/wealthpulse-main/app/components/CallToAction.jsx';
let content = fs.readFileSync(file, 'utf8');

const updatedReturn = `  return (
    <motion.section
      ref={(el) => {
        sectionRef.current = el;
        borderedDivRef.current = el;
      }}
      onMouseMove={onMouseMove}
      className="relative min-h-screen flex flex-col w-full overflow-hidden bg-slate-900 pt-20 group"
    >
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
        className="absolute inset-0 opacity-50 z-0"
        animate={{ backgroundPositionX: starsBg.width }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        style={{
          backgroundImage: \`url(\${starsBg.src})\`,
          backgroundRepeat: "repeat",
          backgroundPositionY,
        }}
      />

      {/* 🔵 Dot Grid */}
      <div
        className="absolute inset-0 opacity-70 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(125,211,252,0.85) 1.6px, transparent 1.6px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* ✨ Hover Effects */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 z-0"
        style={{
          maskImage: spotlightMask,
          backgroundImage:
            "radial-gradient(circle, rgba(186,230,253,1) 2px, transparent 2px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* 🔝 TOP STOCK TICKER */}
      <div className="relative z-20 w-full h-14 md:h-16 overflow-hidden bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center shadow-lg">
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
                    <span className={\`inline-flex items-center gap-0.5 \${isPositive ? "text-green-400" : "text-red-400"}\`}>
                      <span>{isPositive ? "+" : ""}</span>
                      <AnimatedNumber value={formatNum(item.rawChange, 2, 2)} />
                      <span>%</span>
                    </span>
                  </div>
                );
              })}
        </motion.div>
      </div>

      {/* 🧠 CENTER CONTENT */}
      <div className="relative z-10 flex-1 w-full px-6 md:px-12 py-12 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-[1700px] mx-auto min-h-[50vh]">
        
        {/* Left text portion */}
        <div className="w-full lg:w-[50%] flex flex-col items-center lg:items-start text-center lg:text-left justify-center">
           <div className="min-h-[7.5rem] md:min-h-[9rem] flex items-center justify-center lg:justify-start overflow-hidden">
             <AnimatePresence mode="wait">
               <motion.h2
                  key={lineIndex}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight"
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

           <p className="text-lg md:text-xl text-sky-100 mt-6 mb-10 max-w-2xl lg:mx-0 mx-auto">
             Visualize, analyze, and grow your wealth using intelligent
             insights designed for Indian investors.
           </p>

           {isSignedIn ? (
             <Link
               href="/Portfolio"
               className="inline-flex items-center gap-3 bg-white text-blue-900 font-semibold px-8 py-4 rounded-full hover:bg-sky-100 transition shadow-xl hover:shadow-sky-100/20"
             >
               Open Portfolio →
             </Link>
           ) : (
             <a
               href={\`\${loginHref}?screen_hint=signup\`}
               className="inline-flex items-center gap-3 bg-white text-blue-900 font-semibold px-8 py-4 rounded-full hover:bg-sky-100 transition shadow-xl hover:shadow-sky-100/20"
             >
               Get Started →
             </a>
           )}
        </div>

        {/* Right side Video portion */}
        <div className="w-full lg:w-[50%] flex justify-center items-center relative group/video mt-8 lg:mt-0">
           <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-sky-500 rounded-3xl blur-xl opacity-20 group-hover/video:opacity-40 transition duration-500"></div>
           <video
             src="/vid/showcase.mp4"
             autoPlay
             loop
             muted
             playsInline
             controls={false}
             className="relative w-full h-auto max-h-[60vh] rounded-3xl shadow-2xl object-cover border border-white/20"
           />
        </div>

      </div>

      {/* 🔻 BOTTOM BITCOIN TICKER */}
      <div className="relative z-20 w-full h-14 md:h-16 overflow-hidden bg-black/40 backdrop-blur-md border-t border-white/10 flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
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
                    <span className={\`inline-flex items-center gap-0.5 \${item.label === "24H" ? (item.rawValue >= 0 ? "text-green-400" : "text-red-400") : item.color}\`}>
                      <span>{item.label === "24H" ? (item.rawValue >= 0 ? "+" : "") : item.prefix}</span>
                      <AnimatedNumber value={formattedVal} />
                      <span>{item.suffix}</span>
                    </span>
                  </div>
                );
              })}
          </motion.div>
      </div>
    </motion.section>
  );
};
`;

const startIndex = content.lastIndexOf('  return (');
if (startIndex !== -1) {
    content = content.substring(0, startIndex) + updatedReturn;
    fs.writeFileSync(file, content);
    console.log("Successfully replaced the return statement.");
} else {
    console.log("Failed to find '  return (' in the active component code");
}
