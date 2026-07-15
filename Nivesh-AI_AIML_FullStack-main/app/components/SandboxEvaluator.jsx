'use client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const MOCK_TRADES = [
  {
    symbol: 'RELIANCE.NS',
    trade_type: 'buy',
    quantity: 50,
    buy_price: 2450.25,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    ai_behavior_points: 45,
    ai_analysis: "Excellent market entry. You executed this trade during a support bounce on the 15-minute timeframe. This demonstrates high 'Wait-and-Entry' patience, avoiding the psychological trap of FOMO as price tested the 200-EMA."
  },
  {
    symbol: 'TCS.NS',
    trade_type: 'sell',
    quantity: 10,
    buy_price: 3820.50,
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    ai_behavior_points: -15,
    ai_analysis: "Premature liquidation detected. While profitable, the exit was triggered by a minor volatility spike rather than a trend reversal. AI suggests sticking to your trailing stop-loss to capture extended trend movements."
  },
  {
    symbol: 'HDFCBANK.NS',
    trade_type: 'buy',
    quantity: 100,
    buy_price: 1675.00,
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    ai_behavior_points: 30,
    ai_analysis: "Sound risk-management. Position sizing was perfectly calibrated to your current account balance, representing exactly 1.5% risk exposure. This level of discipline is key to long-term capital preservation."
  }
];

export default function SandboxEvaluator({ userId }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userId) return;
      try {
        const r = await fetch(`/api/tradeverse/dashboard/${encodeURIComponent(userId)}`);
        if (r.ok) {
           setDashboard(await r.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="eval-status-container">
        <style jsx>{`
          .eval-status-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: #0a0e1a;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .eval-glow {
            width: 64px;
            height: 64px;
            margin-bottom: 1.5rem;
            position: relative;
          }
          .eval-glow::after {
            content: '';
            position: absolute;
            inset: 0;
            background: #3b82f6;
            filter: blur(20px);
            opacity: 0.2;
            border-radius: 50%;
            animation: eval-pulse 2s infinite;
          }
          @keyframes eval-pulse { 0%, 100% { transform: scale(1); opacity: 0.2; } 50% { transform: scale(1.3); opacity: 0.4; } }
          .eval-loading-text { color: #10b981; font-family: monospace; letter-spacing: 0.2em; animation: eval-blink 1.5s infinite; font-size: 0.8rem; }
          @keyframes eval-blink { 50% { opacity: 0.4; } }
        `}</style>
        <div className="eval-glow">
           <Loader2 className="w-full h-full animate-spin text-[#10b981] relative z-10" />
        </div>
        <p className="eval-loading-text">NEURAL PROCESSING IN PROGRESS...</p>
      </div>
    );
  }

  const realTrades = dashboard?.trades || [];
  const trades = [...MOCK_TRADES, ...realTrades].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  const totalTrades = trades.length;
  const metrics = trades.reduce((acc, trade) => {
    const pts = trade.ai_behavior_points || 0;
    if (pts > 0) acc.goodDecision++;
    if (pts < 0) acc.badDecision++;
    acc.totalPts += pts;
    return acc;
  }, { goodDecision: 0, badDecision: 0, totalPts: 0 });

  const winRate = totalTrades ? Math.round((metrics.goodDecision / totalTrades) * 100) : 0;
  const avgPts = totalTrades ? (metrics.totalPts / totalTrades).toFixed(1) : 0;

  return (
    <div className="eval-root custom-scrollbar">
      <style jsx>{`
        .eval-root {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 3rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .eval-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2rem;
        }
        .eval-header h1 { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
        .eval-header p { color: #94a3b8; font-size: 0.9rem; max-width: 500px; line-height: 1.5; }
        
        .eval-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        
        .eval-card {
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        .eval-card--accent::before {
          content: '';
          position: absolute;
          top: -20%; right: -10%; width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
        }

        .psy-profile { display: flex; align-items: center; gap: 3rem; }
        .iq-gauge { position: relative; width: 140px; height: 140px; flex-shrink: 0; }
        .iq-gauge-content { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .iq-val { font-size: 2rem; font-weight: 900; color: #fff; line-height: 1; }
        .iq-label { font-size: 0.6rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 0.2rem; }

        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; width: 100%; }
        .skill-item { background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.03); padding: 0.75rem 1.25rem; border-radius: 12px; }
        .skill-name { font-size: 0.65rem; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 0.2rem; }
        .skill-val { font-weight: 700; font-size: 0.9rem; }

        .mini-metric { 
          display: flex; flex-direction: column; justify-content: center; 
          background: rgba(30, 41, 59, 0.3); border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 20px; padding: 1.5rem;
        }
        .metric-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 800; margin-bottom: 0.5rem; }
        .metric-val { font-size: 2rem; font-weight: 800; }
        
        .log-section-header { 
          display: flex; justify-content: space-between; align-items: center; 
          margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .log-section-header h2 { font-size: 1.1rem; font-weight: 700; color: #e2e8f0; }
        
        .trade-log-card {
          background: rgba(15, 23, 42, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          display: flex;
          gap: 2rem;
          transition: border-color 0.3s;
        }
        .trade-log-card:hover { border-color: rgba(16, 185, 129, 0.3); }
        
        .trade-side { width: 180px; flex-shrink: 0; border-right: 1px solid rgba(255, 255, 255, 0.05); }
        .type-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; margin-bottom: 0.75rem; }
        .sym { font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 0.2rem; }
        .details { font-family: monospace; color: #94a3b8; font-size: 0.8rem; }
        
        .ai-eval { flex: 1; min-width: 0; }
        .ai-eval-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .ai-eval-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; font-weight: 800; color: #10b981; text-transform: uppercase; }
        .ai-pts { font-family: monospace; font-weight: 800; border-radius: 6px; padding: 0.1rem 0.4rem; }
        .ai-bubble { background: rgba(0, 0, 0, 0.2); padding: 1rem; border-radius: 12px; font-size: 0.85rem; color: #cbd5e1; line-height: 1.6; }

        @media (max-width: 900px) {
          .eval-grid { grid-template-columns: 1fr; }
          .psy-profile { flex-direction: column; gap: 1.5rem; text-align: center; }
          .trade-log-card { flex-direction: column; gap: 1rem; }
          .trade-side { width: 100%; border-right: none; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 1rem; }
        }
      `}</style>

      <div className="eval-header">
         <div>
            <h1>Profile Evaluator</h1>
            <p>Advanced behavioral analytics monitoring your execution mechanics and psychological trajectory.</p>
         </div>
         <div className="flex gap-2">
            <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] text-[10px] font-bold rounded-full border border-[#10b981]/30 flex items-center gap-1.5 ring-4 ring-[#10b981]/5">
               <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-ping" /> AGENT ACTIVE
            </span>
         </div>
      </div>

      <div className="eval-grid">
         <div className="eval-card eval-card--accent">
            <div className="psy-profile">
               <div className="iq-gauge">
                  <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                     <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray={`${winRate * 2.82} 282.6`} strokeLinecap="round" />
                  </svg>
                  <div className="iq-gauge-content">
                     <span className="iq-val">{winRate}%</span>
                     <span className="iq-label">Equity IQ</span>
                  </div>
               </div>
               
               <div className="skills-grid">
                  {[
                    { label: 'Patience', value: 'High', color: '#10b981' },
                    { label: 'Risk Control', value: 'Calculated', color: '#60a5fa' },
                    { label: 'Execution', value: 'Surgical', color: '#818cf8' },
                    { label: 'Discipline', value: 'Prime', color: '#c084fc' }
                  ].map((s, i) => (
                    <div key={i} className="skill-item">
                       <p className="skill-name">{s.label}</p>
                       <p className="skill-val" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="flex flex-col gap-4">
            <div className="mini-metric">
               <span className="metric-label">Behavioral Score</span>
               <span className="metric-val" style={{ color: metrics.totalPts >= 0 ? '#10b981' : '#f87171' }}>
                  {metrics.totalPts > 0 ? '+' : ''}{metrics.totalPts}
               </span>
            </div>
            <div className="mini-metric">
               <span className="metric-label">Avg Interaction</span>
               <span className="metric-val" style={{ color: '#60a5fa' }}>{avgPts}</span>
            </div>
         </div>
      </div>

      <div className="log-section-header">
         <h2>AI Cognitive Ledger</h2>
         <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Historical Iterations ({trades.length})
         </span>
      </div>
      
      <div className="logs-container">
         {trades.map((t, i) => (
            <div key={i} className="trade-log-card">
              <div className="trade-side">
                 <span className="type-badge" style={{ 
                    background: t.trade_type === 'buy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: t.trade_type === 'buy' ? '#10b981' : '#f87171'
                 }}>
                    {t.trade_type}
                 </span>
                 <h4 className="sym">{t.symbol.split('.')[0]}</h4>
                 <p className="details">{t.quantity} QTY @ ₹{t.buy_price.toLocaleString()}</p>
                 <p style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                    {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </p>
              </div>
              
              <div className="ai-eval">
                 <div className="ai-eval-header">
                    <div className="ai-eval-title">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" style={{ boxShadow: '0 0 8px #10b981' }} />
                       AI SUMMARY
                    </div>
                    <span className="ai-pts" style={{ 
                       background: t.ai_behavior_points >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                       color: t.ai_behavior_points >= 0 ? '#10b981' : '#f87171'
                    }}>
                       {t.ai_behavior_points >= 0 ? '+' : ''}{t.ai_behavior_points} PTS
                    </span>
                 </div>
                 <div className="ai-bubble">
                   {t.ai_analysis || "Tactical execution confirmed. Behavioral parameters remain within optimal ranges for this session."}
                 </div>
              </div>
            </div>
         ))}
      </div>
    </div>
  );
}
