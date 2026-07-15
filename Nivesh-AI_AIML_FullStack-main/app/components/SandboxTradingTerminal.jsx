'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SandboxLeaderboard from './SandboxLeaderboard';
import SandboxEvaluator from './SandboxEvaluator';
import SandboxCommunity from './SandboxCommunity';
import { Loader2 } from 'lucide-react';

// ── Icons (SVG inline to avoid dependencies) ──────────────────────────────────
const Icons = {
  Grid: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Chart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Wallet: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Help: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Search: ({className}) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

// ── Shared Config & Mock Data ─────────────────────────────────────────────────
const THEME = {
  bgBase: 'bg-[#0f1519]',      // Very dark blue/slate
  bgCard: 'bg-[#182329]',      // Slightly lighter card
  bgNav:  'bg-[#121a20]',      // Nav background
  accentTeal: 'text-[#10b981]', // Success/Teal
  bgAccent: 'bg-[#10b981]/10',
  border: 'border-[#2d3a43]',
};

const LEVEL_CFG = {
  Beginner: { color: 'text-n-4', bg: 'bg-gray-500/20', border: 'border-gray-500/40', icon: 'LVL 1' },
  Intermediate: { color: 'text-color-5', bg: 'bg-color-5/20', border: 'border-color-5/40', icon: 'LVL 2' },
  Advanced: { color: 'text-color-1', bg: 'bg-color-1/20', border: 'border-color-1/40', icon: 'LVL 3' },
  Pro: { color: 'text-color-2', bg: 'bg-color-2/20', border: 'border-color-2/40', icon: 'PRO' },
};

function Sparkline({ up, className="" }) {
  return (
    <svg width="48" height="20" viewBox="0 0 48 20" className={`overflow-visible ${className}`}>
      {up
        ? <polyline points="0,16 8,12 16,14 24,8 32,6 40,3 48,1" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        : <polyline points="0,3 8,6 16,5 24,11 32,13 40,16 48,18" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function MainSparkline() {
  return (
    <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none" className="overflow-visible">
      {/* Glow Effect */}
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      {/* Area gradient */}
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,50 Q40,45 80,42 T160,35 T220,40 T280,25 T350,15 T400,10 L400,60 L0,60 Z" fill="url(#area)" />
      <path d="M0,50 Q40,45 80,42 T160,35 T220,40 T280,25 T350,15 T400,10" fill="none" stroke="#10b981" strokeWidth="3" filter="url(#glow)" />
      <circle cx="400" cy="10" r="4" fill="#10b981" />
    </svg>
  );
}

// ── Chart Placeholder ─────────────────────────────────────────────────────────
function MockCandlestickChart({ symbol, quote }) {
  const [activeTool, setActiveTool] = useState('cursor');
  const [candles, setCandles] = useState([]);

  // Generate stable mock candles on mount to avoid hydration mismatch and jank
  useEffect(() => {
    const arr = [...Array(50)].map(() => {
      const isGreen = Math.random() > 0.48;
      const low = 15 + Math.random() * 50; // percentage from bottom
      const high = low + 5 + Math.random() * 30; // percentage from bottom
      const open = isGreen ? low + Math.random() * 10 : high - Math.random() * 10;
      const close = isGreen ? high - Math.random() * 10 : low + Math.random() * 10;
      const volH = 5 + Math.random() * 30; // px
      return { isGreen, low, high, open, close, volH };
    });
    setCandles(arr);
  }, []);

  const currentPrice = quote?.price ? fmt(quote.price) : '₹ 2,472.60';
  const priceChange = quote ? (quote.price - quote.previousClose) : 145.30;
  const pctChange = quote ? ((priceChange / quote.previousClose) * 100) : 0.68;
  const isUp = priceChange >= 0;
  const color = isUp ? 'text-[#10b981]' : 'text-[#ef4444]';
  const sign = isUp ? '+' : '';

  const tools = [
    { id: 'cursor', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg> },
    { id: 'line', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> },
    { id: 'text', icon: <span className="font-serif font-bold text-sm leading-none block">T</span> },
    { id: 'trend', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  ];

  return (
    <div className={`relative h-[420px] bg-[#0a0e12] rounded-xl border border-[#1f2937] overflow-hidden flex flex-col`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-xs border-b border-[#1f2937]">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-[#3b82f6] hover:text-white transition-colors cursor-pointer"><Icons.Chart className="w-3 h-3" /> 1D</button>
          <button className="flex items-center gap-1 text-[#10b981] hover:text-white transition-colors cursor-pointer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Indicators</button>
        </div>
        <div>
          <button className="text-gray-500 hover:text-white transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 relative min-h-0">
         {/* Left Toolbar */}
         <div className="w-10 flex flex-col items-center py-2 gap-4 border-r border-[#1a232c] flex-shrink-0 z-20 bg-[#0a0e12]">
            <div className="flex flex-col gap-3 w-full items-center">
              {tools.map((t, idx) => (
                <div key={t.id} className="flex w-full flex-col items-center">
                  <button 
                    onClick={() => setActiveTool(t.id)} 
                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${activeTool === t.id ? 'bg-[#10b981]/15 text-[#10b981]' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {t.icon}
                  </button>
                  {idx === 0 && <div className="w-4 border-b border-gray-700 my-2"/>}
                </div>
              ))}
            </div>
         </div>

         {/* Chart Content Area */}
         <div className={`flex-1 relative overflow-hidden flex flex-col ${activeTool === 'text' ? 'cursor-text' : activeTool === 'line' ? 'cursor-crosshair' : 'cursor-default'}`}>
            
            {/* Info Box */}
            <div className="absolute top-4 left-4 z-20 bg-[#0a0e12]/80 backdrop-blur-md border border-[#1a232c] rounded-xl p-3 shadow-2xl pointer-events-none">
               <div className="flex items-center gap-3 mb-1">
                 <span className="text-white font-bold text-lg leading-none">{symbol?.split('.')[0] || 'TCS'}</span>
                 <span className="text-gray-300 font-mono text-sm leading-none">{currentPrice}</span>
                 <span className={`text-[11px] font-mono leading-none ${color}`}>{sign}{fmt(priceChange).replace('₹','')} ({sign}{pctChange.toFixed(2)}%)</span>
               </div>
               <p className="text-gray-500 text-[11px] mb-2 font-mono mt-2">Volume 37.4L</p>
               <p className="text-[11px] font-mono font-bold"><span className="text-[#3b82f6]">MA(20)</span> <span className="text-[#f59e0b] ml-1">MA(50)</span></p>
            </div>

            {/* Horizontal Grids */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border-t border-[#1a232c] border-dashed opacity-40 w-full" />
              ))}
            </div>

            {/* Candlesticks & Volume */}
            <div className="flex-1 w-full h-[80%] absolute bottom-8 left-0 flex items-center justify-between px-2 z-10 w-[120%] -ml-[10%]">
              {candles.map((c, i) => {
                const candleColor = c.isGreen ? 'bg-[#10b981]' : 'bg-[#ef4444]';
                return (
                  <div key={i} className="flex flex-col items-center flex-1 h-full relative" style={{ justifyContent: 'flex-end' }}>
                     {/* Wick */}
                     <div className={`w-[1px] absolute ${candleColor} opacity-70`} style={{ bottom: `${c.low}%`, top: `${100 - c.high}%` }} />
                     {/* Body */}
                     <div className={`w-1.5 sm:w-2 rounded-[1px] absolute ${candleColor}`} style={{ bottom: `${Math.min(c.open, c.close)}%`, top: `${100 - Math.max(c.open, c.close)}%`, zIndex: 2 }} />
                     
                     {/* Volume Bar */}
                     <div className={`w-[3px] sm:w-[4px] absolute bottom-0 rounded-t-[1px] ${c.isGreen ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} style={{ height: `${c.volH}px`, opacity: 0.2 }} />
                  </div>
                )
              })}
            </div>
            
            {/* X-Axis */}
            <div className="h-7 border-t border-[#1a232c] flex items-center justify-between px-10 text-[10px] text-gray-500 font-mono tracking-wider absolute bottom-0 w-full bg-[#0a0e12]/90 z-20">
               <span>May</span>
               <span>10</span>
               <span>Apr</span>
               <span>13</span>
               <span>15</span>
               <span>Jun</span>
            </div>

         </div>
      </div>
    </div>
  );
}


// ── Watchlist symbols ──────────────────────────────────────────────────────
const WATCHLIST = [
  { symbol: 'NIFTY50.NS', label: 'NIFTY 50' },
  { symbol: 'SENSEX.BO', label: 'SENSEX' },
  { symbol: 'TATASTEEL.NS', label: 'TATASTEEL' },
  { symbol: 'RELIANCE.NS', label: 'RELIANCE' },
  { symbol: 'TCS.NS', label: 'TCS' },
  { symbol: 'HDFCBANK.NS', label: 'HDFCBANK' },
  { symbol: 'INFY.NS', label: 'INFOSYS' },
];

const fmt = (n) => n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (n) => n == null ? '—' : `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
const VIRTUAL_BALANCE_KEY = 'wp_virtual_balance';
const HOLDINGS_KEY = 'wp_holdings';
const INITIAL_BALANCE = 1_000_000;

function getBalance() { try { return JSON.parse(localStorage.getItem(VIRTUAL_BALANCE_KEY)) ?? INITIAL_BALANCE; } catch { return INITIAL_BALANCE; } }
function saveBalance(b) { localStorage.setItem(VIRTUAL_BALANCE_KEY, JSON.stringify(b)); }
function getHoldings() { try { return JSON.parse(localStorage.getItem(HOLDINGS_KEY)) ?? []; } catch { return []; } }
function saveHoldings(h) { localStorage.setItem(HOLDINGS_KEY, JSON.stringify(h)); }

function useLivePrice(asset) {
  const [data, setData] = useState(null);
  const fetch_ = useCallback(async () => {
    if (!asset || !asset.symbol) return;
    try {
      const type = asset.asset_type || 'stock';
      if (type === 'stock') {
        const r = await fetch(`/api/stock/quote/${encodeURIComponent(asset.symbol)}`);
        if (r.ok) setData(await r.json());
      } else if (type === 'crypto') {
        const r = await fetch(`/api/crypto/coin-details/${encodeURIComponent(asset.symbol)}`);
        if (r.ok) {
          const d = await r.json();
          setData({ price: d.current_price, previousClose: d.current_price / (1 + (d.price_change_percentage_24h/100)) });
        }
      } else if (type === 'mutual_fund') {
        const r = await fetch(`/api/mutual/historical-nav/${encodeURIComponent(asset.symbol)}`);
        if (r.ok) {
          const arr = await r.json();
          if (arr.length > 0) setData({ price: parseFloat(arr[0].nav), previousClose: arr.length > 1 ? parseFloat(arr[1].nav) : parseFloat(arr[0].nav) });
        }
      }
    } catch { }
  }, [asset?.symbol, asset?.asset_type]);
  useEffect(() => { fetch_(); const t = setInterval(fetch_, 15000); return () => clearInterval(t); }, [fetch_]);
  return { data, refresh: fetch_ };
}

function useWatchlistPrices() {
  const [prices, setPrices] = useState({});
  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled(
      WATCHLIST.map(async (w) => {
        const r = await fetch(`/api/stock/quote/${encodeURIComponent(w.symbol)}`);
        if (r.ok) return { symbol: w.symbol, data: await r.json() };
        return { symbol: w.symbol, data: null };
      })
    );
    const map = {};
    results.forEach((res) => { if (res.status === 'fulfilled' && res.value.data) map[res.value.symbol] = res.value.data; });
    setPrices(map);
  }, []);
  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 15000); return () => clearInterval(t); }, [fetchAll]);
  return { prices, refresh: fetchAll };
}


// ── Main Component ────────────────────────────────────────────────────────────
export default function SandboxTradingTerminal({ userId, userName, userEmail, collegeName }) {
  const [tab, setTab] = useState('dashboard');
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [holdings, setHoldings] = useState([]);
  const [selectedSymbol, setSelected] = useState({ ...WATCHLIST[2], asset_type: 'stock' }); // TATASTEEL
  const [orderType, setOrderType] = useState('market');
  const [tradeType, setTradeType] = useState('buy');
  const [qty, setQty] = useState('10');
  const [limitPrice, setLimitPrice] = useState('');
  const [tradeMsg, setTradeMsg] = useState(null);
  const [aiEval, setAiEval] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [holdingPrices, setHoldingPrices] = useState({});
  const [marketStatus, setMarketStatus] = useState('OPEN');

  // Unified Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('stock'); // stock, crypto, mutual_fund
  const [searchResults, setSearchResults] = useState([]);
  const [searchActive, setSearchActive] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const prevHoldingPricesRef = useRef({});

  const { prices: watchPrices, refresh: refreshWatch } = useWatchlistPrices();
  const { data: selectedQuote, refresh: refreshQuote } = useLivePrice(selectedSymbol);

  // Search Debouncer
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!searchQuery.trim()) { setSearchResults([]); return; }
      try {
        let res = [];
        if (searchType === 'stock') {
           const r = await fetch(`/api/stock/search-stocks?q=${encodeURIComponent(searchQuery)}`);
           if (r.ok) res = await r.json();
        } else if (searchType === 'crypto') {
           const r = await fetch(`/api/crypto/coins?search=${encodeURIComponent(searchQuery)}`);
           if (r.ok) res = await r.json();
        } else if (searchType === 'mutual_fund') {
           const r = await fetch(`/api/mutual/schemes?search=${encodeURIComponent(searchQuery)}`);
           if (r.ok) {
             const d = await r.json();
             res = Object.keys(d).map(k => ({ symbol: k, name: d[k] }));
           }
        }
        setSearchResults(res || []);
      } catch (err) { console.error("Search API failed", err); }
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery, searchType]);

  useEffect(() => {
    const checkMarket = () => {
      const now = new Date();
      // Calculate IST time mathematically
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istTime = new Date(utc + (5.5 * 60 * 60000));
      
      const day = istTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = istTime.getHours();
      const min = istTime.getMinutes();
      
      let isOpen = false;
      // Monday to Friday
      if (day >= 1 && day <= 5) {
         const totalMins = hour * 60 + min;
         // 9:15 AM (555) to 3:30 PM (930) for NSE/BSE
         if (totalMins >= 555 && totalMins <= 930) {
            isOpen = true;
         }
      }
      setMarketStatus(isOpen ? 'OPEN' : 'CLOSED');
    };
    checkMarket();
    const interval = setInterval(checkMarket, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setBalance(getBalance());
    setHoldings(getHoldings());
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!userId) return;
    try { const r = await fetch(`/api/tradeverse/dashboard/${encodeURIComponent(userId)}`); if (r.ok) setDashboard(await r.json()); } catch { }
  }, [userId]);
  useEffect(() => { fetchDashboard(); const t = setInterval(fetchDashboard, 10000); return () => clearInterval(t); }, [fetchDashboard]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const r = await fetch('/api/tradeverse/leaderboard/global');
      if (r.ok) { const d = await r.json(); setLeaderboard(d.entries || []); }
    } catch { }
  }, []);
  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  useEffect(() => {
    if (!holdings.length) return;
    const symbols = [...new Set(holdings.map(h => h.symbol))];
    const fetchPrices = async () => {
      const map = {};
      await Promise.allSettled(symbols.map(async (sym) => {
        try { const r = await fetch(`/api/stock/quote/${encodeURIComponent(sym)}`); if (r.ok) { const d = await r.json(); map[sym] = d.price; } } catch { }
      }));
      setHoldingPrices(map);
    };
    fetchPrices(); const t = setInterval(fetchPrices, 15000); return () => clearInterval(t);
  }, [holdings]);

  // Track Holdings Notifications
  useEffect(() => {
    if (Object.keys(holdingPrices).length === 0) return;
    const newNotifications = [];
    
    Object.keys(holdingPrices).forEach(sym => {
       const curr = holdingPrices[sym];
       const prev = prevHoldingPricesRef.current[sym];
       if (prev !== undefined && curr !== prev) {
         const diff = curr - prev;
         const pct = ((diff / prev) * 100).toFixed(2);
         if (Math.abs(pct) > 0.05) { // Notify if change is over 0.05%
            newNotifications.push({
               id: Date.now() + Math.random(),
               symbol: sym.split('.')[0],
               message: `${diff > 0 ? 'Surged' : 'Fell'} by ${Math.abs(pct)}% (₹${curr.toFixed(2)})`,
               type: diff > 0 ? 'up' : 'down',
               time: new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}),
               read: false
            });
         }
       }
    });

    if (newNotifications.length > 0) {
      setNotifications(old => [...newNotifications, ...old].slice(0, 30));
    }
    prevHoldingPricesRef.current = holdingPrices;
  }, [holdingPrices]);

  const unreadCount = notifications.filter(n => !n.read).length;


  const executeTrade = async () => {
    const quantity = parseFloat(qty);
    if (!quantity || quantity <= 0) { setTradeMsg({ type: 'error', text: 'Enter valid quantity' }); return; }
    const price = orderType === 'limit' ? parseFloat(limitPrice) : (selectedQuote?.price ?? 0);
    if (!price || price <= 0) { setTradeMsg({ type: 'error', text: 'Price not available' }); return; }

    const total = price * quantity;
    const currentBalance = getBalance();
    const currentHoldings = getHoldings();

    if (tradeType === 'buy') {
      if (total > currentBalance) { setTradeMsg({ type: 'error', text: 'Insufficient virtual funds' }); return; }
      const newBalance = parseFloat((currentBalance - total).toFixed(2));
      const existing = currentHoldings.find(h => h.symbol === selectedSymbol.symbol);
      let newHoldings;
      if (existing) {
        const totalQty = existing.qty + quantity;
        const avgPrice = ((existing.avgPrice * existing.qty) + (price * quantity)) / totalQty;
        newHoldings = currentHoldings.map(h => h.symbol === selectedSymbol.symbol ? { ...h, qty: totalQty, avgPrice } : h);
      } else {
        newHoldings = [...currentHoldings, { symbol: selectedSymbol.symbol, label: selectedSymbol.label, qty: quantity, avgPrice: price }];
      }
      saveBalance(newBalance); saveHoldings(newHoldings); setBalance(newBalance); setHoldings(newHoldings);
    } else {
      const holding = currentHoldings.find(h => h.symbol === selectedSymbol.symbol);
      if (!holding || holding.qty < quantity) { setTradeMsg({ type: 'error', text: 'Insufficient holdings to sell' }); return; }
      const newBalance = parseFloat((currentBalance + total).toFixed(2));
      const newQty = parseFloat((holding.qty - quantity).toFixed(4));
      const newHoldings = newQty > 0 ? currentHoldings.map(h => h.symbol === selectedSymbol.symbol ? { ...h, qty: newQty } : h) : currentHoldings.filter(h => h.symbol !== selectedSymbol.symbol);
      saveBalance(newBalance); saveHoldings(newHoldings); setBalance(newBalance); setHoldings(newHoldings);
    }

    setEvalLoading(true); setAiEval(null); setTradeMsg(null);
    try {
      if (tradeType === 'buy') {
        const portRes = await fetch(`/api/portfolio/add/${encodeURIComponent(userId)}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: selectedSymbol.symbol, item_type: selectedSymbol.asset_type, quantity: quantity, purchase_price: price, purchase_date: new Date().toISOString() })
        });
        if (!portRes.ok) console.error("Portfolio sync failed");
      }

      const tvRes = await fetch(`/api/tradeverse/trades/add/${encodeURIComponent(userId)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: selectedSymbol.symbol, asset_type: selectedSymbol.asset_type, trade_type: tradeType, quantity, buy_price: price })
      });
      if (tvRes.ok) {
        const d = await tvRes.json();
        setAiEval(d.evaluation);
        setTradeMsg({ type: 'success', text: `Trade execution complete!` });
        fetchDashboard();
      } else {
        setTradeMsg({ type: 'success', text: 'Trade successful (Sandbox Eval Skipped).' });
      }
    } catch {
      setTradeMsg({ type: 'error', text: 'AI evaluation failed, but trade processed locally.' });
    } finally {
      setEvalLoading(false);
    }
  };

  const holdingsValue = holdings.reduce((sum, h) => sum + h.qty * (holdingPrices[h.symbol] ?? h.avgPrice), 0);
  const totalValue = balance + holdingsValue;
  const totalPnL = totalValue - INITIAL_BALANCE;
  const totalPnLPct = ((totalPnL / INITIAL_BALANCE) * 100).toFixed(2);
  const execPrice = orderType === 'limit' ? parseFloat(limitPrice || 0) : (selectedQuote?.price ?? 0);
  const estValue = execPrice * (parseFloat(qty) || 0);

  return (
    <div className={`flex min-h-screen ${THEME.bgBase} text-white font-sans overflow-hidden max-h-screen`}>
      
      {/* ── Left Sidebar (Icon only) ── */}
      <aside className={`w-16 flex flex-col items-center py-6 ${THEME.border} border-r flex-shrink-0 relative z-20 ${THEME.bgNav}`}>
        <div className="w-8 h-8 flex items-center justify-center text-[#10b981] mb-8 font-bold text-xl">V</div>
        
        <div className="flex-1 flex flex-col items-center gap-6 w-full">
          {[
            { id: 'dashboard', icon: <Icons.Grid /> },
            { id: 'leaderboard', icon: <Icons.Chart /> },
            { id: 'evaluator', icon: <Icons.Wallet /> },
            { id: 'community', icon: <Icons.Users /> }
          ].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${tab === item.id ? THEME.bgCard + ' text-[#10b981]' : 'text-gray-500 hover:text-white'}`}>
              {item.icon}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6 w-full mt-auto relative">
          <div className="relative group">
            <button 
               onClick={() => { setShowNotifications(!showNotifications); setNotifications(ns => ns.map(n => ({...n, read: true}))); }}
               className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:text-white relative" 
               title="Alerts"
            >
               <Icons.Bell />
               {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#111827]"></span>}
            </button>
            {showNotifications && (
               <div className="absolute bottom-0 left-14 w-64 bg-[#121a20] border border-[#2d3a43] rounded-xl shadow-2xl p-3 z-50">
                  <h4 className="text-white text-xs font-bold mb-3 px-1 border-b border-[#2d3a43] pb-2">Holding Alerts</h4>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                     {notifications.length === 0 ? (
                        <div className="text-center py-6">
                           <p className="text-xs text-gray-500">Monitoring your investments.</p>
                           <p className="text-[10px] text-gray-600 mt-1">Popups will appear when asset prices change significantly.</p>
                        </div>
                     ) : notifications.map(n => (
                        <div key={n.id} className="p-2.5 rounded-lg bg-[#1a232c] border border-white/5">
                           <div className="flex justify-between items-center mb-1">
                              <span className={`font-bold text-xs uppercase tracking-wider ${n.type === 'up' ? 'text-[#10b981]' : 'text-red-500'}`}>{n.symbol}</span>
                              <span className="text-gray-500 text-[10px] font-mono">{n.time}</span>
                           </div>
                           <p className="text-gray-300 text-[11px] leading-tight">{n.message}</p>
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </div>
          <button title="Help" className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:text-white"><Icons.Help /></button>
          <button onClick={() => window.location.href = '/Portfolio'} title="Exit Terminal" className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:text-white mt-2"><Icons.LogOut /></button>
          <button onClick={() => window.location.href = '/'} title="Exit to Website" className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-700 mt-2 mb-2"><Icons.Home /></button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pr-2 pb-6 pl-4 pt-6 custom-scrollbar">
        
        {/* Top Navbar / Market Status */}
        <header className="flex justify-between items-center mb-6 pl-2 pr-4 relative z-10">
           <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Tradeverse Terminal</h2>
              <p className="text-xs text-gray-500 mt-0.5">Advanced Simulated Trading Environment</p>
           </div>
           <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${marketStatus === 'OPEN' ? 'bg-[#10b981]/10 border-[#10b981]/30' : 'bg-red-500/10 border-red-500/30'}`}>
               {marketStatus === 'OPEN' ? (
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
                 </span>
               ) : (
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
               )}
               <span className={`text-xs font-semibold uppercase tracking-wider ${marketStatus === 'OPEN' ? 'text-[#10b981]' : 'text-red-400'}`}>
                 {marketStatus === 'OPEN' ? 'Market Open' : 'Market Closed'}
               </span>
             </div>
           </div>
        </header>

        {/* Dynamic Content Views */}
        {tab === 'leaderboard' ? (
           <SandboxLeaderboard userId={userId} collegeName={collegeName} />
        ) : tab === 'evaluator' ? (
           <SandboxEvaluator userId={userId} />
        ) : tab === 'community' ? (
           <SandboxCommunity />
        ) : (
           <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 max-w-[1600px] flex-1 px-2 pb-6 mt-4">
          
          {/* ────── CENTER COLUMN ────── */}
          <div className="flex flex-col gap-4 min-w-0">
             
             {/* 1. Virtual Portfolio Balance Card */}
             <div className={`${THEME.bgCard} border ${THEME.border} rounded-2xl p-6 relative overflow-hidden flex-shrink-0`}>
                <p className="text-gray-400 text-sm mb-1 pb-1">Virtual Portfolio Balance</p>
                <div className="flex items-baseline gap-1 mb-6">
                   <h1 className="text-5xl font-bold text-[#10b981] tracking-tight">{fmt(totalValue)}</h1>
                </div>
                <p className="text-gray-500 text-xs tracking-widest uppercase mb-10">Virtual Credits</p>
                
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/5 blur-[80px] rounded-full pointer-events-none" />
                
                {/* Embedded Chart line */}
                <div className="absolute right-0 bottom-12 w-[60%] opacity-80 pl-8 pointer-events-none">
                  <MainSparkline />
                </div>

                <div className="flex items-center text-sm relative z-10 pt-4">
                  <span className={`${totalPnL >= 0 ? 'text-[#10b981]' : 'text-red-500'} font-semibold`}>
                    {totalPnL >= 0 ? '+' : ''}{fmt(totalPnL)} ({totalPnLPct}%) Today
                  </span>
                  <span className="text-gray-500 mx-2">|</span>
                  <span className="text-white">{fmt(balance)} Current Cash</span>
                </div>
             </div>

             {/* 2. Chart Component */}
             <MockCandlestickChart symbol={selectedSymbol.symbol} quote={selectedQuote} />

             {/* 3. My Holdings */}
             <div className={`${THEME.bgCard} border ${THEME.border} rounded-2xl p-4 flex-1 flex flex-col`}>
                <h3 className="font-semibold text-gray-200 mb-4 pb-2 border-b border-[#2d3a43]">My Holdings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-gray-500 font-medium">
                        <th className="pb-3 font-normal">Stock</th>
                        <th className="pb-3 font-normal">Price <span className="text-[10px]">↕</span></th>
                        <th className="pb-3 text-center font-normal">Change</th>
                        <th className="pb-3 text-right font-normal">Current Value</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {holdings.map((h) => {
                        const ltp = holdingPrices[h.symbol] ?? h.avgPrice;
                        const pnlPct = ((ltp - h.avgPrice) / h.avgPrice * 100);
                        return (
                          <tr key={h.symbol} className="border-b border-[#2d3a43]/50 last:border-0 hover:bg-white/5 cursor-pointer" onClick={() => setSelected({ symbol: h.symbol, label: h.label, asset_type: h.asset_type })}>
                             <td className="py-3 font-semibold text-white">{h.label}</td>
                             <td className="py-3 font-mono">{fmt(ltp)}</td>
                             <td className={`py-3 text-center font-semibold ${pnlPct >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>{fmtPct(pnlPct)}</td>
                             <td className="py-3 text-right font-mono text-[#10b981]">{fmt(ltp * h.qty)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>

          {/* ────── RIGHT COLUMN ────── */}
          <div className="flex flex-col gap-4 min-w-0">
             
             {/* 1. Market Watch View */}
             <div className={`${THEME.bgCard} border ${THEME.border} rounded-2xl p-4 flex-shrink-0 flex flex-col h-[320px]`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-white">Market Watch & Order Panel</h3>
                  <span className="text-gray-500 tracking-widest cursor-pointer">...</span>
                </div>
                
                <div className="flex gap-4 flex-1 overflow-hidden">
                  {/* Search Bar & Market Panel */}
                  <div className="flex-1 border-r border-[#2d3a43] pr-4 flex flex-col min-h-0">
                     <div className="flex justify-between text-xs text-gray-500 mb-3">
                       <div className="flex bg-[#121a20] rounded gap-1 p-0.5 w-full">
                         {['stock', 'crypto', 'mutual_fund'].map(t => (
                           <button key={t} onClick={() => { setSearchType(t); setSearchResults([]); }} className={`flex-1 py-1 rounded text-[10px] uppercase font-bold transition-colors ${searchType === t ? 'bg-[#2d3a43] text-white' : 'text-gray-500'}`}>{t.replace('_', ' ')}</button>
                         ))}
                       </div>
                     </div>
                     <div className="relative mb-3 flex-shrink-0">
                       <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                       <input type="text" placeholder={`Search ${searchType.replace('_', ' ')}...`} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSearchActive(true); }} onFocus={() => setSearchActive(true)} className="w-full bg-[#121a20] border border-[#2d3a43] text-white text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-[#10b981]" />
                     </div>
                     
                     <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                       {(!searchQuery || !searchActive) ? WATCHLIST.map((w, i) => {
                         const q = watchPrices[w.symbol];
                         const chg = q ? ((q.price - q.previousClose) / q.previousClose * 100) : null;
                         const isSelected = selectedSymbol?.symbol === w.symbol;
                         return (
                           <div key={w.symbol} onClick={() => setSelected({...w, asset_type: 'stock'})} className={`flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg ${isSelected ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                              <div>
                                <p className="text-sm font-semibold text-white">{w.label}</p>
                                <p className="text-xs text-gray-500">{w.symbol.replace('.NS','').replace('.BO','')}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-mono text-white">{q ? fmt(q.price) : '—'}</p>
                                <p className={`text-xs ${chg >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>{chg ? fmtPct(chg) : '—'}</p>
                              </div>
                           </div>
                         )
                       }) : searchResults.map((res, i) => {
                         const sym = searchType === 'stock' ? res.symbol : searchType === 'crypto' ? res.id : res.symbol;
                         const label = searchType === 'crypto' ? res.name : res.name;
                         const isSelected = selectedSymbol?.symbol === sym;
                         return (
                           <div key={sym + i} onClick={() => { setSelected({ symbol: sym, label, asset_type: searchType }); setSearchActive(false); setSearchQuery(''); }} className={`flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg ${isSelected ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="text-sm font-semibold text-white truncate">{label}</p>
                                <p className="text-xs text-gray-500">{sym}</p>
                              </div>
                              {searchType === 'crypto' && res.current_price && (
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-mono text-[#10b981]">{fmt(res.current_price).replace('₹', '$')}</p>
                                </div>
                              )}
                           </div>
                         )
                       })}
                     </div>
                  </div>
                  {/* AI Quick view or Selected details */}
                  <div className="w-[120px] flex flex-col items-center pt-2">
                     <p className="text-xs text-gray-500 w-full text-left mb-6">Real Time</p>
                     
                     <div className="relative w-16 h-16 mb-4">
                        <div className="absolute inset-0 bg-[#3b82f6] blur-xl opacity-30 rounded-full" />
                        <svg className="w-full h-full text-[#9ca3af] relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" opacity="0.3"/><path d="M12 22l-10-5v-6l10 5 10-5v6l-10 5z"/></svg> 
                     </div>
                     <p className="text-xs text-center text-gray-400 mb-2 truncate max-w-full leading-tight">Est. Value: {fmt(estValue)}</p>
                     <button className="w-full py-1.5 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/50 rounded-lg text-xs font-semibold hover:bg-[#10b981] hover:text-white transition-colors">START NOW</button>
                  </div>
                </div>
             </div>

             {/* 2. Trade Panel */}
             <div className={`${THEME.bgCard} border ${THEME.border} rounded-2xl p-5 flex-shrink-0`}>
                <h3 className="font-semibold text-white mb-1">Trade Panel</h3>
                <p className="text-gray-400 text-sm mb-4">{selectedSymbol?.label} ({selectedSymbol?.symbol.split('.')[0]})</p>
                
                <p className="text-gray-500 text-xs mb-2">Order Type</p>
                <div className="flex bg-[#121a20] rounded-lg p-1 border border-[#2d3a43] mb-4">
                  {['market', 'limit'].map(t => (
                    <button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${orderType === t ? 'bg-[#2d3a43] text-white' : 'text-gray-500'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                  ))}
                </div>

                <p className="text-gray-500 text-xs mb-2">Quantity</p>
                <div className="flex items-center bg-[#121a20] border border-[#2d3a43] rounded-lg px-3 py-2 mb-4 justify-between">
                  <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className="bg-transparent border-none text-white focus:outline-none w-full" />
                  <div className="flex flex-col">
                    <button onClick={() => setQty(String(Number(qty)+1))} className="text-gray-500 hover:text-white leading-none">▴</button>
                    <button onClick={() => setQty(String(Math.max(1, Number(qty)-1)))} className="text-gray-500 hover:text-white leading-none">▾</button>
                  </div>
                </div>

                <p className="text-gray-500 text-xs mb-2">Price</p>
                <div className="bg-[#121a20] border border-[#2d3a43] rounded-lg px-3 py-2 mb-4">
                  <input type="text" value={orderType === 'market' ? (selectedQuote?.price || '') : limitPrice} onChange={e => setLimitPrice(e.target.value)} disabled={orderType === 'market'} className="bg-transparent border-none text-white focus:outline-none w-full text-lg font-mono disabled:opacity-70" placeholder="0.00" />
                </div>

                <button onClick={() => { setTradeType('buy'); executeTrade(); }} disabled={!selectedQuote?.price} className="w-full py-2.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/50 rounded-lg font-bold mb-2 transition-all hover:bg-[#10b981] hover:text-white disabled:opacity-50">
                  BUY {selectedSymbol?.label.split(' ')[0]}
                </button>
                <button onClick={() => { setTradeType('sell'); executeTrade(); }} disabled={!selectedQuote?.price} className="w-full py-2.5 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/50 rounded-lg font-bold mb-3 transition-all hover:bg-[#ef4444] hover:text-white disabled:opacity-50">
                  SELL {selectedSymbol?.label.split(' ')[0]}
                </button>

                <p className="text-center text-xs text-gray-500">Est. Value: {fmt(estValue)}</p>
                
                {tradeMsg && (
                  <div className={`mt-3 text-xs text-center border rounded-md p-2 ${tradeMsg.type === 'success' ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
                    {tradeMsg.text}
                  </div>
                )}
             </div>

             {/* 3. Leaderboard Preview */}
             <div className={`${THEME.bgCard} border ${THEME.border} rounded-2xl p-4 flex-1 flex flex-col min-h-[200px]`}>
                 <h3 className="font-semibold text-white mb-1">Leaderboard:</h3>
                 <p className="text-gray-400 text-sm mb-4">Top Virtual Traders</p>
                 
                 <div className="space-y-2 flex-1">
                    {leaderboard.slice(0, 4).map((entry, i) => {
                      const isMe = entry.user_id === userId;
                      return (
                        <div key={entry.user_id || i} className={`flex items-center gap-3 p-2 rounded-lg border ${isMe ? 'bg-[#10b981]/10 border-[#10b981]/30' : 'bg-[#121a20] border-[#2d3a43]'}`}>
                           <span className="text-gray-500 font-bold w-4 text-center">{i + 1}</span>
                           <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${entry.email || 'User'}`} className="w-8 h-8 rounded-full bg-gray-700" alt="av" />
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-semibold text-white truncate">{entry.email?.split('@')[0] || 'Trader'} {isMe && '(Me)'}</p>
                             <p className="text-xs text-gray-500 font-mono">₹{entry.credit_score?.toLocaleString()}</p>
                           </div>
                        </div>
                      )
                    })}
                 </div>
             </div>

          </div>
        </div>
        )}

      </main>

      {/* Global Scrollbar Customization for this dark theme */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f1519;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2d3a43;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #374151;
        }
      `}} />
    </div>
  );
}
