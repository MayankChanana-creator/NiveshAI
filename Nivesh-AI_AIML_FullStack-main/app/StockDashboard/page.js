// "use client";
// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import Navbar from "../components/Navbar";
// import Chatbot from "../components/Chatbot";

// const stocksPerPage = 9;

// function useDebounce(value, delay = 500) {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const handler = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(handler);
//   }, [value, delay]);
//   return debounced;
// }

// function getRandomSubset(arr, count) {
//   if (!Array.isArray(arr)) return [];
//   const shuffled = arr.slice().sort(() => 0.5 - Math.random());
//   return shuffled.slice(0, count);
// }

// export default function StockDashboard() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const debouncedSearch = useDebounce(searchTerm, 500);
//   const [stocks, setStocks] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [page, setPage] = useState(1);

//   // Load random stocks initially (e.g., from backend API)
//   useEffect(() => {
//     if (debouncedSearch) return; // skip random-load if searching

//     setLoading(true);
//     setError("");
//     fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/list`)
//       .then(async (res) => {
//         if (!res.ok) throw new Error("Failed to fetch stock list");
//         const arr = await res.json();
//         // arr should be [{ symbol: 'TCS.NS', longName: 'Tata Consultancy Services', ...}, ...]
//         setStocks(getRandomSubset(arr, stocksPerPage));
//         setPage(1);
//       })
//       .catch((e) => {
//         setError("Could not fetch stocks.");
//         setStocks([]);
//       })
//       .finally(() => setLoading(false));
//   }, [debouncedSearch]);

//   // Load searched stock if a symbol is entered
//   useEffect(() => {
//     if (!debouncedSearch) return;
//     setLoading(true);
//     setError("");
//     fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/search?symbol=${encodeURIComponent(debouncedSearch)}`)
//       .then(async (res) => {
//         if (!res.ok) throw new Error("Failed to fetch stock");
//         const data = await res.json();
//         setStocks(data.found ? [data] : []);
//         setPage(1);
//       })
//       .catch((e) => {
//         setError("Could not fetch stock.");
//         setStocks([]);
//       })
//       .finally(() => setLoading(false));
//   }, [debouncedSearch]);

//   const currentStocks = stocks.slice((page - 1) * stocksPerPage, page * stocksPerPage);

//   return (
//     <>
//     <Navbar />
//     <section className="min-h-screen px-7 py-18 bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] flex flex-col">

//       <div className="max-w-5xl mx-auto">
//         <h2 className="text-3xl font-bold mb-8 text-white text-center">View Stocks</h2>
//         <div className="flex justify-center mb-8">
//           <input
//             value={searchTerm}
//             onChange={e => setSearchTerm(e.target.value)}
//             className="text-white bg-white/10 px-4 py-3 rounded-full focus:ring-2 focus:ring-purple-600 max-w-xl w-full"
//             placeholder="Enter Stock Symbol (e.g. TCS.NS)…"
//           />
//         </div>
//         <div>
//           {loading ? (
//             <div className="text-center py-8 text-gray-300">Loading…</div>
//           ) : error ? (
//             <div className="text-center py-8 text-red-300">{error}</div>
//           ) : currentStocks.length > 0 ? (
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//               {currentStocks.map((stock) => (
//                 <Link href={`/StockDashboard/${stock.symbol}`} key={stock.symbol}>
//                   <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-md hover:bg-white/20 transition-colors cursor-pointer flex flex-col h-full">
//                     <div className="text-purple-200 font-semibold mb-2">{stock.longName || stock.symbol}</div>
//                     <div className="text-xs text-gray-300 mb-3">Symbol: <span className="font-mono">{stock.symbol}</span></div>
//                     <button className="mt-auto py-2 px-4 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white rounded-full shadow font-bold">
//                       View Details →
//                     </button>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-8 text-gray-300">No stocks found.</div>
//           )}
//         </div>
//       </div>
//     </section>
//     <Chatbot />
//     </>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";
import { motion } from "framer-motion";

const stocksPerPage = 9;

/* ------------------ Helpers ------------------ */
function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

function getRandomSubset(arr, count) {
  if (!Array.isArray(arr)) return [];
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/* ------------------ Page ------------------ */
export default function StockDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (debouncedSearch) return;
    setLoading(true);
    setError("");

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/list`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        const arr = await res.json();
        setStocks(getRandomSubset(arr, stocksPerPage));
      })
      .catch(() => {
        setError("Could not fetch stocks.");
        setStocks([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  useEffect(() => {
    if (!debouncedSearch) return;
    setLoading(true);
    setError("");

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/stock/search?symbol=${encodeURIComponent(
        debouncedSearch
      )}`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setStocks(data.found ? [data] : []);
      })
      .catch(() => {
        setError("Could not fetch stock.");
        setStocks([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  return (
    <>
      <Navbar />

      <section className="relative min-h-screen px-7 py-20 overflow-hidden bg-[#050b1f]">

        {/* ================= VISIBLE SVG WAVES ================= */}
        {/* ===== VISIBLE ANIMATED BACKGROUND ===== */}
<div className="absolute inset-0 overflow-hidden -z-10">

  {/* Wave Layer 1 */}
  <motion.div
    className="absolute -top-40 -left-1/2 w-[200%] h-[500px]"
    style={{
      background:
        "linear-gradient(120deg, rgba(56,189,248,0.35), rgba(14,165,233,0.25), rgba(56,189,248,0.35))",
      filter: "blur(80px)",
    }}
    animate={{ x: ["0%", "25%", "0%"] }}
    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
  />

  {/* Wave Layer 2 */}
  <motion.div
    className="absolute top-[30%] -right-1/2 w-[200%] h-[500px]"
    style={{
      background:
        "linear-gradient(100deg, rgba(125,211,252,0.3), rgba(38,198,218,0.25))",
      filter: "blur(90px)",
    }}
    animate={{ x: ["0%", "-25%", "0%"] }}
    transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
  />

  {/* Wave Layer 3 */}
  <motion.div
    className="absolute bottom-[-20%] left-[-30%] w-[160%] h-[400px]"
    style={{
      background:
        "linear-gradient(140deg, rgba(186,230,253,0.35), rgba(56,189,248,0.2))",
      filter: "blur(100px)",
    }}
    animate={{ x: ["0%", "20%", "0%"] }}
    transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
  />
</div>


        {/* ================= CONTENT ================= */}
        <div className="relative z-10 max-w-5xl mx-auto">

          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-10 text-white text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Explore Indian Stocks
          </motion.h2>

          <div className="flex justify-center mb-10">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full max-w-xl
                bg-white/10 backdrop-blur-xl
                text-white px-5 py-4
                rounded-full
                border border-white/20
                focus:ring-2 focus:ring-sky-400
                outline-none
                placeholder:text-gray-300
              "
              placeholder="Search stock symbol (e.g. TCS.NS)"
            />
          </div>

          {loading ? (
            <div className="text-center text-gray-300 py-10">Loading stocks…</div>
          ) : error ? (
            <div className="text-center text-red-300 py-10">{error}</div>
          ) : stocks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stocks.map((stock, i) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link href={`/StockDashboard/${stock.symbol}`}>
                    <div className="bg-white/12 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition cursor-pointer shadow-xl flex flex-col">
                      <div className="text-sky-300 font-semibold mb-2 text-lg">
                        {stock.longName || stock.symbol}
                      </div>
                      <div className="text-sm text-gray-300 mb-4">
                        Symbol: <span className="font-mono">{stock.symbol}</span>
                      </div>

                      <button className="mt-auto py-2 px-4 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-full font-semibold shadow-md hover:scale-105 transition">
                        View Details →
                      </button>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-300 py-10">No stocks found.</div>
          )}
        </div>
      </section>

      <Chatbot />
    </>
  );
}

