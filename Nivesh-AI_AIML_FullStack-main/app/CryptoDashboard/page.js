// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import Link from "next/link";
// import Navbar from "../components/Navbar";

// // Debounce utility
// const useDebounce = (value, delay) => {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const handler = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(handler);
//   }, [value, delay]);
//   return debounced;
// };

// const fetchCoins = async (search = "") => {
//   const url = search
//     ? `${process.env.NEXT_PUBLIC_API_URL}/api/crypto/coins?search=${encodeURIComponent(search)}`
//     : `${process.env.NEXT_PUBLIC_API_URL}/api/crypto/famous`; // <- NOTE: fetch famous coins for blank search
//   const res = await fetch(url);
//   if (!res.ok) return [];
//   return await res.json();
// };

// export default function CryptoDashboardPage() {
//   const [search, setSearch] = useState("");
//   const debouncedSearch = useDebounce(search, 400);
//   const [loading, setLoading] = useState(false);
//   const [coins, setCoins] = useState([]);
//   const [displayedCoins, setDisplayedCoins] = useState([]);
//   const [noResults, setNoResults] = useState(false);
//   const inputRef = useRef();

//   useEffect(() => {
//     setLoading(true);
//     fetchCoins(debouncedSearch).then((data) => {
//       setCoins(data);
//       // Show up to 8 matching results for queries
//       const coinArr = debouncedSearch ? data.slice(0, 8) : data;
//       setDisplayedCoins(coinArr);
//       setNoResults(coinArr.length === 0);
//       setLoading(false);
//     }).catch(error => {
//       console.error('Error fetching coins:', error);
//       setLoading(false);
//       setNoResults(true);
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
//       <div className="max-w-5xl mx-auto px-8 py-5">
//         {/* Title */}
       
//         {/* Searchbar */}
//         <div className="flex justify-center mb-8 relative">
//           <input
//             ref={inputRef}
//             value={search}
//             onChange={onSearchChange}
//             type="text"
//             placeholder="Search Cryptocurrencies by name or symbol…"
//             className="w-full max-w-md px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-md"
//             aria-label="Search Cryptocurrencies"
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
//             <span className="text-4xl mb-4 opacity-70">🔍</span>
//             <span className="text-gray-400 text-lg">
//               No cryptocurrencies found. Try another search!
//             </span>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
//             {displayedCoins.map((coin) => (
//               <div
//                 key={coin.id}
//                 className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col hover:bg-white/10 transition-colors"
//               >
//                 <h3 className="text-lg font-semibold mb-2 text-white">{coin.name}</h3>
//                 <div className="text-xs text-gray-300 mb-3">
//                   Symbol: <span className="font-mono uppercase">{coin.symbol}</span>
//                 </div>
//                 <div className="text-xs text-gray-400 mb-5">
//                   ID: <span className="font-mono">{coin.id}</span>
//                 </div>
//                 <Link href={`/CryptoDashboard/${coin.id}`}>
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
//     </section>
//     </>
//   );
// }



"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
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

const fetchCoins = async (search = "") => {
  const url = search
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/crypto/coins?search=${encodeURIComponent(search)}`
    : `${process.env.NEXT_PUBLIC_API_URL}/api/crypto/famous`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return await res.json();
};

export default function CryptoDashboardPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [loading, setLoading] = useState(false);
  const [displayedCoins, setDisplayedCoins] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchCoins(debouncedSearch)
      .then((data) => {
        const coins = debouncedSearch ? data.slice(0, 8) : data;
        setDisplayedCoins(coins);
        setNoResults(coins.length === 0);
        setLoading(false);
      })
      .catch(() => {
        setNoResults(true);
        setLoading(false);
      });
  }, [debouncedSearch]);

  return (
    <>
      <Navbar />

      <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] py-20 text-white">

        {/* 🌊 Animated Blue Wave Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute -top-48 -left-1/2 w-[200%] h-[500px]"
            style={{
              background:
                "linear-gradient(120deg, rgba(56,189,248,0.35), rgba(14,165,233,0.25), rgba(56,189,248,0.35))",
              filter: "blur(90px)",
            }}
            animate={{ x: ["0%", "25%", "0%"] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute bottom-[-25%] right-[-40%] w-[180%] h-[420px]"
            style={{
              background:
                "linear-gradient(140deg, rgba(186,230,253,0.35), rgba(56,189,248,0.25))",
              filter: "blur(110px)",
            }}
            animate={{ x: ["0%", "-20%", "0%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">

          {/* 🔍 Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-12"
          >
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cryptocurrencies by name or symbol…"
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
              No cryptocurrencies found. Try another search.
            </div>
          )}

          {/* 🪙 Coin Cards */}
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
              {displayedCoins.map((coin) => (
                <motion.div
                  key={coin.id}
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
                  <h3 className="text-lg font-semibold mb-2">{coin.name}</h3>

                  <p className="text-xs text-gray-300 mb-2">
                    Symbol:{" "}
                    <span className="font-mono uppercase">{coin.symbol}</span>
                  </p>

                  <p className="text-xs text-gray-400 mb-6">
                    ID: <span className="font-mono">{coin.id}</span>
                  </p>

                  <Link href={`/CryptoDashboard/${coin.id}`}>
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
      </section>
    </>
  );
}
