"use client";

import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, AlertCircle, ArrowLeft, Play, Search } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
  ReferenceLine,
} from 'recharts';

const BEHAVIOURS = [
  { id: 'panic', label: 'Panic Seller', description: 'Sells on every dip, re-enters late.', color: '#f43f5e' },
  { id: 'calm', label: 'Calm Investor', description: 'Stays the course, minor rebalancing.', color: '#38bdf8' },
  { id: 'greedy', label: 'Greedy Trader', description: 'Buys every dip aggressively, never sells.', color: '#fbbf24' },
  { id: 'neutral', label: 'Buy & Hold', description: 'Invests once and holds. The benchmark.', color: '#a78bfa' },
];

export default function SimulatorPage() {
  const [symbol, setSymbol] = useState('');
  const [itemType, setItemType] = useState('stock');
  const [selectedBehaviour, setSelectedBehaviour] = useState(null);
  const [investment, setInvestment] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runSimulation = async () => {
    if (!symbol.trim() || !selectedBehaviour) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/simulator/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.trim(),
          item_type: itemType,
          behaviour: selectedBehaviour,
          initial_investment: investment,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Simulation failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const behaviourData = BEHAVIOURS.find(b => b.id === selectedBehaviour);
  const summary = result?.summary;

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-[#020617] text-white font-sans selection:bg-violet-500/30">
        
        {/* Ambient background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/Learn" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight">What-If Simulator</h1>
              <p className="text-sm text-slate-400">How would different investor types perform on your chosen asset?</p>
            </div>
          </div>

          {!result ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Input Section */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <h2 className="text-lg font-bold mb-6">Configure Simulation</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Asset Type */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block">Asset Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setItemType('stock')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${itemType === 'stock' ? 'bg-violet-500 text-white' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        Stock
                      </button>
                      <button
                        onClick={() => setItemType('mutual_fund')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${itemType === 'mutual_fund' ? 'bg-violet-500 text-white' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        Mutual Fund
                      </button>
                    </div>
                  </div>

                  {/* Symbol */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block">
                      {itemType === 'stock' ? 'Stock Symbol' : 'Scheme Code'}
                    </label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      placeholder={itemType === 'stock' ? 'e.g. TCS.NS, RELIANCE.NS' : 'e.g. 119551'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  {/* Investment Amount */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block">Investment (₹)</label>
                    <input
                      type="number"
                      value={investment}
                      onChange={(e) => setInvestment(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Behaviour Selection */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4 block">Select Investor Behaviour</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {BEHAVIOURS.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBehaviour(b.id)}
                        className={`p-5 rounded-2xl text-left transition-all border ${
                          selectedBehaviour === b.id 
                            ? 'bg-white/10 border-violet-500/50 scale-[1.02]' 
                            : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="text-sm font-bold mb-1" style={{ color: b.color }}>{b.label}</div>
                        <div className="text-[11px] text-slate-500">{b.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={runSimulation}
                  disabled={!symbol.trim() || !selectedBehaviour || loading}
                  className="mt-8 w-full py-4 rounded-2xl bg-violet-500 text-white font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-violet-500/20 hover:bg-violet-400 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run Simulation
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">
                    {result.symbol} — {behaviourData?.label}
                  </h2>
                  <p className="text-sm text-slate-400">Simulation results over 1 year of historical data</p>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="px-6 py-3 rounded-2xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> New Simulation
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Final Value</div>
                  <div className="text-2xl font-black text-white">₹{summary?.final_value?.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Your Return</div>
                  <div className={`text-2xl font-black ${summary?.profit_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {summary?.profit_percent >= 0 ? '+' : ''}{summary?.profit_percent?.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Market (Buy & Hold)</div>
                  <div className={`text-2xl font-black ${summary?.market_profit_percent >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                    {summary?.market_profit_percent >= 0 ? '+' : ''}{summary?.market_profit_percent?.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Outperformance</div>
                  <div className={`text-2xl font-black ${summary?.outperformance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {summary?.outperformance >= 0 ? '+' : ''}{summary?.outperformance?.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-6">Portfolio Value Over Time</h3>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.timeline}>
                      <defs>
                        <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={behaviourData?.color || '#8b5cf6'} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={behaviourData?.color || '#8b5cf6'} stopOpacity={0} />
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
                        tickFormatter={(val) => `₹${(val/1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value, name) => {
                          if (name === 'portfolio_value') return [`₹${Number(value).toLocaleString()}`, 'Portfolio'];
                          return [value, name];
                        }}
                      />
                      <ReferenceLine y={investment} stroke="#64748b" strokeDasharray="6 4" strokeWidth={1} label={{ value: 'Initial', position: 'right', fill: '#64748b', fontSize: 10 }} />
                      <Area 
                        type="monotone" 
                        dataKey="portfolio_value" 
                        stroke={behaviourData?.color || '#8b5cf6'} 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#portfolioGrad)" 
                        name="portfolio_value"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trade Actions Timeline */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-4">Trade Actions</h3>
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {result.timeline
                    .filter(t => t.action !== 'HOLD')
                    .map((t, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className={`font-black uppercase ${t.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.action}</span>
                        <span className="text-gray-400">{t.date}</span>
                        <span className="font-mono text-white">₹{t.close.toLocaleString()}</span>
                        <span className="text-gray-500">Shares: {t.shares}</span>
                      </div>
                    ))
                  }
                  {result.timeline.filter(t => t.action !== 'HOLD').length === 0 && (
                    <div className="text-gray-500 text-xs italic text-center py-4">No trades made (buy & hold strategy)</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Chatbot />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </>
  );
}
