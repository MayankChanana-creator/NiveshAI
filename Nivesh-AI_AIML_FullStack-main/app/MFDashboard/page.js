// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import Link from "next/link";
// import Navbar from "../components/Navbar";
// import Chatbot from "../components/Chatbot";

// // Debounce utility
// const useDebounce = (value, delay) => {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const handler = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(handler);
//   }, [value, delay]);
//   return debounced;
// };

// const fetchSchemes = async (search = "") => {
//   const url = search
//     ? `${process.env.NEXT_PUBLIC_API_URL}/api/mutual/schemes?search=${encodeURIComponent(search)}`
//     : `${process.env.NEXT_PUBLIC_API_URL}/api/mutual/schemes`;
//   const res = await fetch(url);
//   if (!res.ok) return {};
//   return await res.json();
// };

// function getRandomMFs(schemesObj, count = 6) {
//   const entries = Object.entries(schemesObj);
//   if (entries.length <= count) return entries;
//   const shuffled = entries.sort(() => 0.5 - Math.random());
//   return shuffled.slice(0, count);
// }

// export default function MFDashboardPage() {
//   const [search, setSearch] = useState("");
//   const debouncedSearch = useDebounce(search, 400);
//   const [loading, setLoading] = useState(false);
//   const [schemes, setSchemes] = useState({});
//   const [displayedMfs, setDisplayedMfs] = useState([]);
//   const [noResults, setNoResults] = useState(false);
//   const inputRef = useRef();

//   useEffect(() => {
//     setLoading(true);
//     fetchSchemes(debouncedSearch).then((data) => {
//       setSchemes(data);
//       if (debouncedSearch) {
//         // Show up to 8 matching results for queries
//         const mfArr = Object.entries(data).slice(0, 8);
//         setDisplayedMfs(mfArr);
//         setNoResults(mfArr.length === 0);
//       } else {
//         // Show 6 random funds for blank search
//         const mfArr = getRandomMFs(data, 6);
//         setDisplayedMfs(mfArr);
//         setNoResults(mfArr.length === 0);
//       }
//       setLoading(false);
//     });
//   }, [debouncedSearch]);

//   const onSearchChange = (e) => setSearch(e.target.value);
//   const onClearSearch = () => {
//     setSearch("");
//     inputRef.current.focus();
//   };

//   return (
//     <>
//     <Navbar />
//     <section className="relative min-h-screen bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] py-16 text-white">
//       <div className="max-w-5xl mx-auto px-9">
//         {/* Searchbar */}
//         <div className="flex justify-center mb-8 py-9 relative">
//           <input
//             ref={inputRef}
//             value={search}
//             onChange={onSearchChange}
//             type="text"
//             placeholder="Search Mutual Funds by name…"
//             className="w-full max-w-md px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-md"
//             aria-label="Search Mutual Funds"
//           />
//           {search && (
//             <button
//               onClick={onClearSearch}
//               className="absolute right-8 top-2.5 text-white/60 hover:text-white/90 text-xl"
//               aria-label="Clear Search"
//             >
//               ×
//             </button>
//           )}
//         </div>

//         {loading ? (
//           <div className="flex justify-center py-12">
//             <span className="animate-spin border-4 border-purple-400 border-t-transparent rounded-full w-8 h-8"></span>
//           </div>
//         ) : noResults ? (
//           <div className="flex flex-col items-center py-16">
//             <span className="text-4xl mb-4 opacity-70">😕</span>
//             <span className="text-gray-400 text-lg">
//               No mutual funds found. Try another search!
//             </span>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
//             {displayedMfs.map(([code, name]) => (
//               <div
//                 key={code}
//                 className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col hover:bg-white/10 transition-colors"
//               >
//                 <h3 className="text-lg font-semibold mb-2">{name}</h3>
//                 <div className="text-xs text-gray-300 mb-5">
//                   Scheme Code: <span className="font-mono">{code}</span>
//                 </div>
//                 <Link href={`/MFDashboard/${code}`}>
//                   <button className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white text-sm font-semibold px-4 py-2 rounded-full shadow hover:scale-[1.03] transition-transform">
//                     View Details →
//                   </button>
//                 </Link>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//       <div className="absolute left-0 right-0 bottom-0 h-48 bg-gradient-to-t from-[#0b0710]/80 to-transparent" />
//       <Chatbot />
//     </section>
//     </>
//   );
// }


"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";
import { motion } from "framer-motion";

/* Debounce utility */
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

const fetchSchemes = async (search = "") => {
  const url = search
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/mutual/schemes?search=${encodeURIComponent(search)}`
    : `${process.env.NEXT_PUBLIC_API_URL}/api/mutual/schemes`;
  const res = await fetch(url);
  if (!res.ok) return {};
  return await res.json();
};

function getRandomMFs(schemesObj, count = 6) {
  const entries = Object.entries(schemesObj);
  if (entries.length <= count) return entries;
  return entries.sort(() => 0.5 - Math.random()).slice(0, count);
}

export default function MFDashboardPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [loading, setLoading] = useState(false);
  const [displayedMfs, setDisplayedMfs] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchSchemes(debouncedSearch).then((data) => {
      if (debouncedSearch) {
        const arr = Object.entries(data).slice(0, 9);
        setDisplayedMfs(arr);
        setNoResults(arr.length === 0);
      } else {
        const arr = getRandomMFs(data, 9);
        setDisplayedMfs(arr);
        setNoResults(arr.length === 0);
      }
      setLoading(false);
    });
  }, [debouncedSearch]);

  return (
    <>
      <Navbar />

      <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] py-20 text-white">

        {/* 🌊 Animated Background Waves */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute -top-40 -left-1/2 w-[200%] h-[500px]"
            style={{
              background:
                "linear-gradient(120deg, rgba(56,189,248,0.35), rgba(14,165,233,0.25), rgba(56,189,248,0.35))",
              filter: "blur(90px)",
            }}
            animate={{ x: ["0%", "25%", "0%"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[-20%] right-[-40%] w-[180%] h-[420px]"
            style={{
              background:
                "linear-gradient(140deg, rgba(186,230,253,0.3), rgba(56,189,248,0.2))",
              filter: "blur(100px)",
            }}
            animate={{ x: ["0%", "-20%", "0%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">

          {/* 🔍 Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-12"
          >
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Mutual Funds by name…"
              className="w-full max-w-md px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 backdrop-blur-md"
            />
          </motion.div>

          {/* ⏳ Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <span className="animate-spin border-4 border-sky-400 border-t-transparent rounded-full w-8 h-8" />
            </div>
          )}

          {/* ❌ No Results */}
          {!loading && noResults && (
            <div className="text-center py-20 text-gray-400">
              No mutual funds found. Try another search.
            </div>
          )}

          {/* 📦 Cards */}
          {!loading && !noResults && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08 },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {displayedMfs.map(([code, name]) => (
                <motion.div
                  key={code}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  whileHover={{
                    y: -6,
                    boxShadow: "0 20px 40px rgba(56,189,248,0.25)",
                  }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl transition-all"
                >
                  <h3 className="text-lg font-semibold mb-2">{name}</h3>
                  <p className="text-xs text-gray-300 mb-6">
                    Scheme Code: <span className="font-mono">{code}</span>
                  </p>

                  <Link href={`/MFDashboard/${code}`}>
                    <button className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 rounded-full text-sm font-semibold shadow hover:scale-105 transition">
                      View Details →
                    </button>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Bottom fade */}
        <div className="absolute left-0 right-0 bottom-0 h-48 bg-gradient-to-t from-[#0b0710]/80 to-transparent" />

        <Chatbot />
      </section>
    </>
  );
}
