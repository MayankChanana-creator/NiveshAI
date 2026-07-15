'use client';

import { useState, useEffect } from 'react';
import { useRealtimeRefresh } from '@/app/context/RealtimeContext';

/**
 * SandboxLeaderboard Component (Redesigned)
 *
 * Shows:
 * - Global leaderboard
 * - College leaderboard
 * - User's rank and progress
 * - Level badges
 */

export default function SandboxLeaderboard({ userId, collegeName }) {
  const [leaderboardType, setLeaderboardType] = useState('global');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRank, setUserRank] = useState(null);
  const { refreshTrigger } = useRealtimeRefresh();

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, [leaderboardType, collegeName, refreshTrigger]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      let url;
      if (leaderboardType === 'global') {
        url = '/api/tradeverse/leaderboard/global';
      } else if (leaderboardType === 'college' && collegeName) {
        url = `/api/tradeverse/leaderboard/college/${encodeURIComponent(collegeName)}`;
      } else {
        setError('College information not available');
        setLoading(false);
        return;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setEntries(data.entries || []);
      if (leaderboardType === 'global') {
        const rankResponse = await fetch(
          `/api/tradeverse/leaderboard/global/user-rank/${userId}`
        );
        if (rankResponse.ok) {
          const rankData = await rankResponse.json();
          setUserRank(rankData);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLevelStyle = (level) => {
    switch (level) {
      case 'Beginner':
        return { bg: 'rgba(250, 204, 21, 0.15)', border: 'rgba(250, 204, 21, 0.4)', text: '#fbbf24' };
      case 'Intermediate':
        return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#60a5fa' };
      case 'Pro':
        return { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: '#c084fc' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', border: 'rgba(156, 163, 175, 0.4)', text: '#9ca3af' };
    }
  };

  const getRankBadge = (index) => {
    if (index === 0) return { label: '1', glow: '0 0 20px rgba(255, 215, 0, 0.6)', bg: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.08))', color: '#fbbf24', border: 'rgba(250, 204, 21, 0.5)' };
    if (index === 1) return { label: '2', glow: '0 0 20px rgba(192, 192, 192, 0.5)', bg: 'linear-gradient(135deg, rgba(192,192,192,0.15), rgba(169,169,169,0.08))', color: '#d1d5db', border: 'rgba(209, 213, 219, 0.5)' };
    if (index === 2) return { label: '3', glow: '0 0 20px rgba(205, 127, 50, 0.5)', bg: 'linear-gradient(135deg, rgba(205,127,50,0.15), rgba(184,115,51,0.08))', color: '#d97706', border: 'rgba(217, 119, 6, 0.5)' };
    return null;
  };

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .lb-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          min-height: 100vh;
          background: #0a0e1a;
          position: relative;
          overflow: hidden;
          padding: 2rem;
        }

        /* Animated gradient orbs */
        .lb-root::before {
          content: '';
          position: absolute;
          top: -20%;
          left: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          animation: lb-float 12s ease-in-out infinite;
        }
        .lb-root::after {
          content: '';
          position: absolute;
          bottom: -15%;
          right: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%);
          animation: lb-float 15s ease-in-out infinite reverse;
        }

        @keyframes lb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        @keyframes lb-fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes lb-pulseGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.2); }
          50% { box-shadow: 0 0 50px rgba(99, 102, 241, 0.35); }
        }

        @keyframes lb-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes lb-spin {
          to { transform: rotate(360deg); }
        }

        .lb-content {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* ── Header ── */
        .lb-header {
          margin-bottom: 2.5rem;
          animation: lb-fadeSlideUp 0.6s ease-out;
        }
        .lb-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #e0e7ff, #c7d2fe, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.03em;
        }
        .lb-header p {
          color: rgba(148, 163, 184, 0.8);
          font-size: 1rem;
          font-weight: 400;
          margin: 0;
        }

        /* ── Tab Selector ── */
        .lb-tabs {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          animation: lb-fadeSlideUp 0.7s ease-out;
        }
        .lb-tab {
          padding: 0.65rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(148, 163, 184, 0.9);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .lb-tab:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }
        .lb-tab--active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.15));
          border-color: rgba(129, 140, 248, 0.5);
          color: #c7d2fe;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        /* ── User Position Card ── */
        .lb-user-card {
          margin-bottom: 2rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.06));
          border: 1.5px solid rgba(129, 140, 248, 0.25);
          border-radius: 20px;
          padding: 2rem;
          backdrop-filter: blur(20px);
          animation: lb-fadeSlideUp 0.8s ease-out, lb-pulseGlow 4s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .lb-user-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.5), transparent);
        }
        .lb-user-card-inner {
          text-align: center;
        }
        .lb-user-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: rgba(196, 181, 253, 0.9);
          margin: 0 0 0.75rem 0;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .lb-user-rank {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #818cf8, #a78bfa, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.25rem 0;
          line-height: 1.1;
        }
        .lb-user-score {
          font-size: 1rem;
          color: rgba(148, 163, 184, 0.8);
          margin: 0 0 1.5rem 0;
        }
        .lb-user-score strong {
          color: #e0e7ff;
          font-weight: 700;
        }
        .lb-user-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .lb-stat-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: 1rem;
          transition: all 0.3s ease;
        }
        .lb-stat-card:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-2px);
        }
        .lb-stat-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(148, 163, 184, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 0.4rem 0;
        }
        .lb-stat-value {
          font-size: 1.35rem;
          font-weight: 700;
          margin: 0;
        }
        .lb-stat-value--indigo { color: #a5b4fc; }
        .lb-stat-value--green { color: #86efac; }
        .lb-stat-value--purple { color: #d8b4fe; }

        /* ── Leaderboard Table ── */
        .lb-table-wrap {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          animation: lb-fadeSlideUp 0.9s ease-out;
        }

        .lb-table {
          width: 100%;
          border-collapse: collapse;
        }
        .lb-table thead {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08));
        }
        .lb-table th {
          padding: 1rem 1.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(196, 181, 253, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .lb-table th:nth-child(n+4) { text-align: right; }

        .lb-table tbody tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          transition: all 0.3s ease;
          animation: lb-fadeSlideUp 0.5s ease-out backwards;
        }
        .lb-table tbody tr:hover {
          background: rgba(99, 102, 241, 0.06);
        }
        .lb-table td {
          padding: 1rem 1.5rem;
          vertical-align: middle;
        }
        .lb-table td:nth-child(n+4) { text-align: right; }

        /* Rank cell */
        .lb-rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 800;
          border: 1.5px solid;
          letter-spacing: -0.02em;
        }
        .lb-rank-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          font-weight: 700;
          font-size: 0.9rem;
          color: rgba(148, 163, 184, 0.7);
        }

        /* Trader cell */
        .lb-trader-name {
          font-weight: 600;
          color: #e2e8f0;
          font-size: 0.95rem;
          margin: 0;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .lb-trader-college {
          font-size: 0.75rem;
          color: rgba(148, 163, 184, 0.5);
          margin: 0.15rem 0 0 0;
        }

        /* Level badge */
        .lb-level-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid;
        }

        /* Score */
        .lb-score {
          font-weight: 700;
          font-size: 1.05rem;
          color: #e0e7ff;
          font-variant-numeric: tabular-nums;
        }

        /* Consistency bar */
        .lb-consistency-wrap {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.6rem;
        }
        .lb-bar-track {
          width: 60px;
          height: 5px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
        }
        .lb-bar-fill {
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(90deg, #6ee7b7, #60a5fa);
          transition: width 0.6s ease;
        }
        .lb-consistency-pct {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(148, 163, 184, 0.7);
          width: 36px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        /* Trades count */
        .lb-trades {
          font-weight: 600;
          color: rgba(226, 232, 240, 0.8);
          font-variant-numeric: tabular-nums;
        }

        /* Loading / Error / Empty */
        .lb-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: rgba(148, 163, 184, 0.6);
        }
        .lb-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(129, 140, 248, 0.15);
          border-top-color: #818cf8;
          border-radius: 50%;
          animation: lb-spin 0.8s linear infinite;
        }
        .lb-error {
          color: #fca5a5;
          font-weight: 600;
        }
        .lb-empty-svg {
          width: 56px;
          height: 56px;
          opacity: 0.25;
          margin-bottom: 1rem;
        }

        /* ── Tips Card ── */
        .lb-tips {
          margin-top: 2rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(59, 130, 246, 0.04));
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 16px;
          padding: 1.5rem 2rem;
          animation: lb-fadeSlideUp 1s ease-out;
        }
        .lb-tips h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #c7d2fe;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .lb-tips ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem 1.5rem;
        }
        .lb-tips li {
          font-size: 0.85rem;
          color: rgba(148, 163, 184, 0.8);
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          line-height: 1.4;
        }
        .lb-tip-dot {
          flex-shrink: 0;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #818cf8;
          margin-top: 7px;
          box-shadow: 0 0 8px rgba(129, 140, 248, 0.4);
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .lb-root { padding: 1rem; }
          .lb-header h1 { font-size: 1.8rem; }
          .lb-user-stats { grid-template-columns: 1fr; }
          .lb-tips ul { grid-template-columns: 1fr; }
          .lb-table th, .lb-table td { padding: 0.75rem 1rem; font-size: 0.85rem; }
        }
      `}</style>

      <div className="lb-root">
        <div className="lb-content">

          {/* ── Header ── */}
          <div className="lb-header">
            <h1>Leaderboard</h1>
            <p>Compete with fellow investors and climb the rankings</p>
          </div>

          {/* ── Tab Selector ── */}
          <div className="lb-tabs">
            <button
              onClick={() => setLeaderboardType('global')}
              className={`lb-tab ${leaderboardType === 'global' ? 'lb-tab--active' : ''}`}
            >
              Global
            </button>
            {collegeName && (
              <button
                onClick={() => setLeaderboardType('college')}
                className={`lb-tab ${leaderboardType === 'college' ? 'lb-tab--active' : ''}`}
              >
                {collegeName.substring(0, 20)}
              </button>
            )}
          </div>

          {/* ── User Position Card ── */}
          {userRank && (
            <div className="lb-user-card">
              <div className="lb-user-card-inner">
                <p className="lb-user-card-title">Your Position</p>
                <p className="lb-user-rank">#{userRank.rank}</p>
                <p className="lb-user-score">
                  Credit Score: <strong>{userRank.entry.credit_score}</strong>
                </p>
                <div className="lb-user-stats">
                  <div className="lb-stat-card">
                    <p className="lb-stat-label">Level</p>
                    <p className="lb-stat-value lb-stat-value--indigo">
                      {userRank.entry.level}
                    </p>
                  </div>
                  <div className="lb-stat-card">
                    <p className="lb-stat-label">Trades</p>
                    <p className="lb-stat-value lb-stat-value--green">
                      {userRank.entry.trades_count}
                    </p>
                  </div>
                  <div className="lb-stat-card">
                    <p className="lb-stat-label">Consistency</p>
                    <p className="lb-stat-value lb-stat-value--purple">
                      {(userRank.entry.consistency_score * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Leaderboard Table ── */}
          <div className="lb-table-wrap">
            {loading ? (
              <div className="lb-status">
                <div className="lb-spinner" />
              </div>
            ) : error ? (
              <div className="lb-status">
                <p className="lb-error">{error}</p>
              </div>
            ) : entries.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="lb-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Trader</th>
                      <th>Level</th>
                      <th>Credit Score</th>
                      <th>Consistency</th>
                      <th>Trades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => {
                      const badge = getRankBadge(index);
                      const levelStyle = getLevelStyle(entry.level);
                      return (
                        <tr
                          key={entry.user_id}
                          style={{
                            animationDelay: `${index * 0.06}s`,
                            background: badge ? badge.bg : undefined,
                          }}
                        >
                          {/* Rank */}
                          <td>
                            {badge ? (
                              <span
                                className="lb-rank-badge"
                                style={{ boxShadow: badge.glow, color: badge.color, borderColor: badge.border }}
                              >
                                {badge.label}
                              </span>
                            ) : (
                              <span className="lb-rank-number">
                                {entry.rank}
                              </span>
                            )}
                          </td>

                          {/* Trader */}
                          <td>
                            <p className="lb-trader-name">
                              {entry.email?.split('@')[0] || `User ${entry.user_id}`}
                            </p>
                            {entry.college_name && (
                              <p className="lb-trader-college">{entry.college_name}</p>
                            )}
                          </td>

                          {/* Level */}
                          <td>
                            <span
                              className="lb-level-badge"
                              style={{
                                background: levelStyle.bg,
                                borderColor: levelStyle.border,
                                color: levelStyle.text,
                              }}
                            >
                              {entry.level}
                            </span>
                          </td>

                          {/* Credit Score */}
                          <td>
                            <span className="lb-score">
                              {entry.credit_score.toLocaleString()}
                            </span>
                          </td>

                          {/* Consistency */}
                          <td>
                            <div className="lb-consistency-wrap">
                              <div className="lb-bar-track">
                                <div
                                  className="lb-bar-fill"
                                  style={{
                                    width: `${Math.min(entry.consistency_score * 100, 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="lb-consistency-pct">
                                {(entry.consistency_score * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>

                          {/* Trades */}
                          <td>
                            <span className="lb-trades">{entry.trades_count}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="lb-status">
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No traders yet. Be the first!</p>
              </div>
            )}
          </div>

          {/* ── Tips Card ── */}
          <div className="lb-tips">
            <h3>How to Climb the Leaderboard</h3>
            <ul>
              <li>
                <span className="lb-tip-dot" />
                Make good trades aligned with your goals (+25 to +50 pts)
              </li>
              <li>
                <span className="lb-tip-dot" />
                Trade consistently — avoid panic selling (−0 to −100 pts)
              </li>
              <li>
                <span className="lb-tip-dot" />
                Level up: Beginner → Intermediate → Pro (2000+ pts)
              </li>
              <li>
                <span className="lb-tip-dot" />
                Diversify your portfolio across asset classes
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}