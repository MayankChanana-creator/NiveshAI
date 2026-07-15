"use client";

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  Newspaper, 
  Clock, 
  BarChart3,
  Calendar,
  AlertCircle,
  Trophy,
  Skull,
  Search,
  ArrowLeft
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceArea
} from 'recharts';

export default function HistoricalReplay() {
  // State for Scenario Selection
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState(null);
  const [customSymbols, setCustomSymbols] = useState({});

  // State for Replay Engine
  const [replayData, setReplayData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  
  // State for Trading
  const [balance, setBalance] = useState(100000);
  const [shares, setShares] = useState(0);
  const [tradeQty, setTradeQty] = useState(1);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // State for News
  const [recentNews, setRecentNews] = useState(null);
  const [showNews, setShowNews] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/replay/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const startReplay = async (eventId, symbol) => {
    setLoadingEvents(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/replay/data?event_id=${eventId}&symbol=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setReplayData(data);
        setSelectedEvent(events.find(e => e.id === eventId));
        setSelectedSymbol(symbol);
        setCurrentIndex(20);
        setBalance(100000);
        setShares(0);
        setTradeHistory([]);
        setIsGameOver(false);
        setIsPlaying(false);
      } else {
        const errData = await res.json();
        setError(errData.detail || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Failed to fetch replay data", err);
      setError("Market data not available for this symbol in this era.");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      timerRef.current = setInterval(() => {
        nextStep();
      }, speed);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentIndex, isGameOver, speed]);

  const nextStep = () => {
    if (!replayData) return;
    if (currentIndex < replayData.candles.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      
      const currentDate = replayData.candles[nextIdx].date;
      const news = replayData.news.find(n => n.date === currentDate);
      if (news) {
        setRecentNews(news);
        setShowNews(true);
        setIsPlaying(false);
      }
    } else {
      setIsGameOver(true);
      setIsPlaying(false);
    }
  };

  const handleBuy = () => {
    if (isGameOver || !replayData) return;
    const currentPrice = replayData.candles[currentIndex].close;
    const qty = parseInt(tradeQty) || 0;
    if (qty <= 0) return;
    
    if (balance >= currentPrice * qty) {
      const cost = qty * currentPrice;
      setShares(prev => prev + qty);
      setBalance(prev => prev - cost);
      setTradeHistory(prev => [...prev, { type: 'BUY', price: currentPrice, qty, date: replayData.candles[currentIndex].date }]);
    }
  };

  const handleSell = () => {
    if (isGameOver || !replayData || shares <= 0) return;
    const currentPrice = replayData.candles[currentIndex].close;
    const qty = Math.min(parseInt(tradeQty) || 0, shares);
    if (qty <= 0) return;

    const revenue = qty * currentPrice;
    setTradeHistory(prev => [...prev, { type: 'SELL', price: currentPrice, qty, date: replayData.candles[currentIndex].date }]);
    setBalance(prev => prev + revenue);
    setShares(prev => prev - qty);
  };

  // Calculations
  const currentPrice = replayData?.candles[currentIndex]?.close || 0;
  const portfolioValue = balance + (shares * currentPrice);
  const initialValue = 100000;
  const pnl = portfolioValue - initialValue;
  const pnlPercent = (pnl / initialValue) * 100;
  
  const marketStartPrice = replayData?.candles[20]?.close || 1;
  const marketCurrentPrice = replayData?.candles[currentIndex]?.close || 1;
  const marketReturn = ((marketCurrentPrice - marketStartPrice) / marketStartPrice) * 100;

  const currentData = replayData ? replayData.candles.slice(0, currentIndex + 1) : [];

  const getCurrencySymbol = (code) => {
    const symbols = { 'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£' };
    return symbols[code] || code || '';
  };

  const currencySymbol = getCurrencySymbol(replayData?.currency);

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-[#020617] text-white font-sans selection:bg-sky-500/30">
        
        {/* Ambient background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto">
          
          {!selectedEvent ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              {/* Back link */}
              <div className="flex justify-start mb-8">
                <Link href="/Learn" className="flex items-center gap-2 p-2 pr-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm text-slate-400">
                  <ArrowLeft className="w-4 h-4" /> Back to Learn
                </Link>
              </div>

              <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Historical Replay Engine
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-lg">
                "Relive the chaos. Trade the history. Beat the market."
                Select a legendary market event and see if you have what it takes to survive.
              </p>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center gap-3 text-rose-400 text-sm font-bold max-w-xl mx-auto"
                >
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 text-left group cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-xl font-bold mb-3 group-hover:text-sky-400 transition-colors">{event.name}</h3>
                    <p className="text-sm text-gray-400 mb-6 line-clamp-3">{event.description}</p>
                    
                    <div className="space-y-4">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Select Asset to Trade</div>
                        <div className="flex flex-col gap-2">
                           {event.assets.map(asset => (
                             <button
                                key={asset.symbol}
                                onClick={() => startReplay(event.id, asset.symbol)}
                                className="w-full py-3 px-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-sky-500 hover:border-sky-400 hover:text-white text-xs font-bold transition-all flex justify-between items-center group/btn"
                             >
                               {asset.name}
                               <TrendingUp className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                             </button>
                           ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                           <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Search Custom Asset</div>
                           <div className="flex gap-2">
                              <input 
                                 type="text" 
                                 placeholder="e.g. AAPL, RELIANCE.NS" 
                                 className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 transition-colors uppercase"
                                 value={customSymbols[event.id] || ''}
                                 onChange={(e) => setCustomSymbols({...customSymbols, [event.id]: e.target.value.toUpperCase()})}
                                 onKeyDown={(e) => {
                                    if (e.key === 'Enter' && customSymbols[event.id]) {
                                       startReplay(event.id, customSymbols[event.id]);
                                    }
                                 }}
                              />
                              <button 
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    if (customSymbols[event.id]) {
                                       startReplay(event.id, customSymbols[event.id]);
                                    }
                                 }}
                                 className="p-2 bg-sky-500/20 text-sky-400 rounded-xl hover:bg-sky-500 hover:text-white transition-all"
                              >
                                 <Search className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-500/10 blur-3xl rounded-full" />
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-sky-500/20 rounded-2xl">
                      <Clock className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Current Date</div>
                      <div className="text-lg font-mono font-bold">{replayData?.candles[currentIndex]?.date}</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Portfolio Value</div>
                      <div className="text-3xl font-black text-white">{currencySymbol}{portfolioValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                      <div className={`text-sm font-bold flex items-center gap-1 mt-1 ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}% ({currencySymbol}{Math.abs(pnl).toLocaleString()})
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Cash</div>
                        <div className="text-md font-bold text-gray-300">{currencySymbol}{balance.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Shares</div>
                        <div className="text-md font-bold text-gray-300">{shares}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                       <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Market (Buy & Hold)</div>
                       <div className={`text-md font-bold ${marketReturn >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                         {marketReturn.toFixed(2)}%
                       </div>
                    </div>
                  </div>
                </motion.div>

                <div className="bg-white/5 rounded-[24px] p-4 border border-white/10 mb-4">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 flex justify-between">
                    <span>Units to Trade</span>
                    {tradeQty > 0 && <span className="text-sky-400">Total: {currencySymbol}{(tradeQty * currentPrice).toLocaleString()}</span>}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min="1"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-md font-bold focus:outline-none focus:border-sky-500 transition-colors w-20"
                      value={tradeQty}
                      onChange={(e) => setTradeQty(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => setTradeQty(Math.floor(balance / currentPrice))}
                        className="px-3 py-1 bg-sky-500/10 text-sky-400 text-[8px] font-black rounded-lg border border-sky-500/20 hover:bg-sky-500 hover:text-white transition-all uppercase"
                      >
                        Max Buy
                      </button>
                      <button 
                        onClick={() => setTradeQty(shares)}
                        className="px-3 py-1 bg-rose-500/10 text-rose-400 text-[8px] font-black rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all uppercase"
                      >
                        All Sell
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleBuy}
                    disabled={isGameOver || balance < currentPrice * tradeQty || tradeQty <= 0}
                    className="py-4 rounded-[20px] bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale uppercase"
                  >
                    BUY {tradeQty}
                  </button>
                  <button 
                    onClick={handleSell}
                    disabled={isGameOver || shares < tradeQty || tradeQty <= 0}
                    className="py-4 rounded-[20px] bg-rose-500 text-white font-black text-sm shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale uppercase"
                  >
                    SELL {tradeQty}
                  </button>
                </div>

                <div className="bg-white/5 rounded-3xl p-4 border border-white/10">
                   <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                     <Clock className="w-3 h-3" /> Replay Controls
                   </div>
                   <div className="flex items-center justify-between gap-2">
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>
                      <button 
                        onClick={nextStep}
                        className="flex-1 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-xs font-bold"
                      >
                        NEXT DAY
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedEvent(null);
                          setReplayData(null);
                          setIsGameOver(false);
                        }}
                        className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                   </div>
                   <div className="mt-4">
                      <div className="flex justify-between text-[8px] text-gray-500 uppercase font-black mb-2">
                        <span>Replay Speed</span>
                        <span>{speed}ms</span>
                      </div>
                      <input 
                        type="range" min="100" max="2000" step="100" 
                        value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                   </div>
                </div>
              </div>

              {/* Main Area */}
              <div className="lg:col-span-3 space-y-6 relative">
                 
                 {/* News Flash Alert */}
                 <AnimatePresence>
                   {showNews && recentNews && (
                     <motion.div 
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.9 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
                     >
                        <div className="bg-black/80 backdrop-blur-xl border-2 border-sky-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(56,189,248,0.3)] relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-10">
                              <Newspaper className="w-24 h-24 rotate-12" />
                           </div>
                           <div className="flex items-start gap-4">
                              <div className="p-3 bg-sky-500 rounded-2xl animate-pulse">
                                 <AlertCircle className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                 <div className="text-[10px] text-sky-400 font-black uppercase tracking-widest mb-1">Breaking News - {recentNews.date}</div>
                                 <h4 className="text-xl font-black text-white leading-tight mb-4">{recentNews.headline}</h4>
                                 <button 
                                    onClick={() => {
                                       setShowNews(false);
                                       setIsPlaying(true);
                                    }}
                                    className="px-6 py-2 bg-sky-500 text-white text-xs font-bold rounded-full hover:bg-sky-400 transition-all active:scale-95"
                                 >
                                    RESUME TRADING
                                 </button>
                              </div>
                           </div>
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 {/* Chart Card */}
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 shadow-2xl relative"
                 >
                    <div className="flex justify-between items-end mb-8">
                       <div>
                          <div className="flex items-center gap-2 mb-2">
                             <span className="px-3 py-1 bg-sky-500/20 text-sky-400 text-[10px] font-black rounded-full uppercase tracking-tighter">Live Session</span>
                             <span className="text-gray-500 text-xs font-medium">/{selectedEvent.name}</span>
                          </div>
                          <h2 className="text-2xl font-black">{selectedSymbol} <span className="text-gray-500 font-light">History</span></h2>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Current Price</div>
                          <div className="text-3xl font-mono font-black text-sky-400">{currencySymbol}{currentPrice.toFixed(2)}</div>
                       </div>
                    </div>

                    <div className="h-[450px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={currentData}>
                             <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                             <XAxis 
                                dataKey="date" 
                                stroke="rgba(255,255,255,0.2)" 
                                fontSize={10} 
                                tickFormatter={(str) => {
                                   const d = new Date(str);
                                   return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                }}
                             />
                             <YAxis 
                                stroke="rgba(255,255,255,0.2)" 
                                fontSize={10} 
                                domain={['auto', 'auto']}
                                tickFormatter={(val) => `${currencySymbol}${val}`}
                             />
                             <Tooltip 
                                contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)'}}
                                itemStyle={{color: '#38bdf8', fontWeight: 'bold'}}
                             />
                             <Area 
                                type="monotone" 
                                dataKey="close" 
                                stroke="#38bdf8" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorPrice)" 
                                animationDuration={speed}
                             />
                             
                             {tradeHistory.map((t, i) => (
                               <ReferenceArea 
                                  key={i}
                                  x1={t.date}
                                  x2={t.date}
                                  stroke={t.type === 'BUY' ? '#10b981' : '#f43f5e'}
                                  strokeOpacity={0.5}
                                  strokeWidth={2}
                               />
                             ))}
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                          <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                             <BarChart3 className="w-4 h-4" /> Live Trade Log
                          </h4>
                          <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                             {tradeHistory.length === 0 ? (
                               <div className="text-gray-600 text-xs italic">No trades made yet...</div>
                             ) : (
                               [...tradeHistory].reverse().map((t, i) => (
                                 <div key={i} className="flex justify-between items-center text-xs p-2 rounded-xl bg-white/5 border border-white/5">
                                    <span className={`font-black ${t.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.type}</span>
                                    <span className="text-gray-400">{t.date}</span>
                                    <span className="font-mono">{currencySymbol}{t.price.toFixed(0)}</span>
                                 </div>
                               ))
                             )}
                          </div>
                       </div>
                       
                       <div className="bg-sky-500/5 rounded-3xl p-6 border border-sky-500/10">
                          <h4 className="text-xs font-black uppercase tracking-widest text-sky-400 mb-4 flex items-center gap-2">
                             <Calendar className="w-4 h-4" /> Scenario Backstory
                          </h4>
                          <p className="text-xs text-blue-100/60 leading-relaxed italic">
                             {selectedEvent.description}
                          </p>
                       </div>
                    </div>
                 </motion.div>
              </div>
            </div>
          )}

          {/* Game Over Modal */}
          <AnimatePresence>
             {isGameOver && selectedEvent && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
               >
                 <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-[48px] p-12 max-w-2xl w-full text-center shadow-[0_0_100px_rgba(56,189,248,0.2)]"
                 >
                    {pnl >= 0 ? (
                      <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                         <Trophy className="w-12 h-12 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                         <Skull className="w-12 h-12 text-rose-400" />
                      </div>
                    )}

                    <h2 className="text-5xl font-black mb-2">
                       {pnl >= 0 ? "LEGENDARY" : "RECKLESS"}
                    </h2>
                    <p className="text-gray-400 mb-12">The market session has concluded.</p>

                    <div className="grid grid-cols-2 gap-8 mb-12">
                       <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                          <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Your Performance</div>
                          <div className={`text-4xl font-black ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {pnlPercent.toFixed(2)}%
                          </div>
                       </div>
                       <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                          <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Market Performance</div>
                          <div className="text-4xl font-black text-sky-400">
                             {marketReturn.toFixed(2)}%
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                       <button 
                          onClick={() => {
                            setSelectedEvent(null);
                            setReplayData(null);
                            setIsGameOver(false);
                          }}
                          className="px-12 py-5 bg-sky-500 text-white font-black rounded-3xl hover:bg-sky-400 transition-all flex items-center justify-center gap-3"
                       >
                          <Clock className="w-5 h-5" /> TRY ANOTHER ERA
                       </button>
                       <button 
                          onClick={() => startReplay(selectedEvent.id, selectedSymbol)}
                          className="px-12 py-5 bg-white/10 text-white font-black rounded-3xl hover:bg-white/20 transition-all"
                       >
                          RETRY SESSION
                       </button>
                    </div>
                 </motion.div>
               </motion.div>
             )}
          </AnimatePresence>

        </div>
      </div>
      <Chatbot />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </>
  );
}
