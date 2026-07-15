'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Award, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useRealtimeRefresh } from '@/app/context/RealtimeContext';
import MarketStatus from './MarketStatus';

/**
 * SandboxDashboard Component
 * 
 * Main dashboard showing:
 * - User AI profile and credit score
 * - Recent trades with AI feedback
 * - Portfolio metrics
 * - Behavioral patterns
 * - Points earned/deducted
 * - Path to next level
 */

export default function SandboxDashboard({ userId, onAddTrade }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { refreshTrigger } = useRealtimeRefresh();

  useEffect(() => {
    fetchDashboard();

    // Auto-refresh every 3 seconds for real-time updates
    const interval = setInterval(fetchDashboard, 3000);
    return () => clearInterval(interval);
  }, [userId, refreshTrigger]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`/api/tradeverse/dashboard/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      const data = await response.json();
      setDashboard(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddTrade = async (...args) => {
    if (onAddTrade) {
      await onAddTrade?.(...args);
    }
    // Force immediate refresh after trade is added
    setRefreshing(true);
    setTimeout(fetchDashboard, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-semibold">Error: {error}</p>
      </div>
    );
  }

  if (!dashboard) return null;

  const { ai_profile, portfolio_metrics, recent_feedback, behavioral_patterns } = dashboard;
  const nextLevelThreshold = ai_profile.next_level_threshold;
  const pointsNeeded = ai_profile.points_to_next_level;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🎯 Trading Sandbox Dashboard
        </h1>
        <p className="text-gray-600">
          Learn, trade, and climb the leaderboard using our AI-powered feedback
        </p>
      </div>

      {/* Market Status - Real-Time */}
      <div className="mb-6">
        <MarketStatus />
      </div>

      {/* AI Profile & Level Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Credit Score */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="text-sm opacity-90 mb-1">Credit Score</div>
            <div className="text-4xl font-bold">{ai_profile.credit_score}</div>
            {pointsNeeded > 0 && (
              <div className="text-xs opacity-75 mt-2">
                {pointsNeeded} points to next level
              </div>
            )}
          </div>

          {/* Risk Score */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
            <div className="text-sm opacity-90 mb-1">Risk Score</div>
            <div className="text-4xl font-bold">{ai_profile.risk_score}/100</div>
            <div className="text-xs opacity-75 mt-2">
              {ai_profile.risk_score < 30 ? 'Conservative' : 
               ai_profile.risk_score < 60 ? 'Balanced' : 
               'Aggressive'}
            </div>
          </div>

          {/* Level Badge */}
          <div className={`bg-gradient-to-br ${
            ai_profile.level === 'Beginner' ? 'from-yellow-500 to-orange-600' :
            ai_profile.level === 'Intermediate' ? 'from-blue-500 to-indigo-600' :
            'from-purple-500 to-violet-600'
          } rounded-xl p-6 text-white`}>
            <div className="text-sm opacity-90 mb-1">Level</div>
            <div className="text-3xl font-bold">{ai_profile.level}</div>
            <div className="text-xs opacity-75 mt-2">
              {ai_profile.level === 'Beginner' ? '🌱' :
               ai_profile.level === 'Intermediate' ? '📚' :
               '🏆'} Investor
            </div>
          </div>

          {/* Trades Count */}
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 text-white">
            <div className="text-sm opacity-90 mb-1">Trades</div>
            <div className="text-4xl font-bold">{ai_profile.trades_count}</div>
            <div className="text-xs opacity-75 mt-2">Experience building</div>
          </div>
        </div>

        {/* Level Progress Bar */}
        {pointsNeeded > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Progress to {ai_profile.level === 'Beginner' ? 'Intermediate' : ai_profile.level === 'Intermediate' ? 'Pro' : 'Master'}
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                  style={{
                    width: `${100 - (pointsNeeded / (nextLevelThreshold || 1)) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {pointsNeeded} points needed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Value */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Portfolio Value</h3>
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₹{portfolio_metrics.total_value.toLocaleString('en-IN', {
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {portfolio_metrics.total_trades} positions
          </p>
        </div>

        {/* P&L */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Total P&L</h3>
            <TrendingUp
              className={`w-5 h-5 ${
                portfolio_metrics.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            />
          </div>
          <p
            className={`text-3xl font-bold ${
              portfolio_metrics.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ₹{portfolio_metrics.total_pnl.toLocaleString('en-IN', {
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {portfolio_metrics.winning_trades} winning trades
          </p>
        </div>

        {/* Win Rate */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Win Rate</h3>
            <Award className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {portfolio_metrics.total_trades > 0
              ? ((portfolio_metrics.winning_trades / portfolio_metrics.total_trades) * 100).toFixed(
                  1
                )
              : '0'}
            %
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {portfolio_metrics.total_trades} total trades
          </p>
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Latest Trade Feedback</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {recent_feedback.length > 0 ? (
              recent_feedback.map((feedback) => (
                <div key={feedback.trade_id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{feedback.symbol}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(feedback.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        feedback.feedback === 'excellent'
                          ? 'bg-green-100 text-green-700'
                          : feedback.feedback === 'good'
                          ? 'bg-blue-100 text-blue-700'
                          : feedback.feedback === 'neutral'
                          ? 'bg-gray-100 text-gray-700'
                          : feedback.feedback === 'warning'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {feedback.feedback.charAt(0).toUpperCase() + feedback.feedback.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {feedback.points > 0 ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={`font-semibold ${
                        feedback.points > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {feedback.points > 0 ? '+' : ''}{feedback.points} points
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-600">
                No trades yet. Start trading to see feedback!
              </div>
            )}
          </div>
        </div>

        {/* Behavioral Patterns */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Your Patterns</h2>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          {Object.keys(behavioral_patterns).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(behavioral_patterns).map(([pattern, data]) => (
                <div key={pattern} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-900 text-sm">{pattern}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Detected {data.count} time{data.count > 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              📊 Trade more to build behavioral profile
            </p>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          onClick={onAddTrade}
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:shadow-lg active:scale-95 transition-all"
        >
          ➕ Add New Trade
        </button>
      </div>
    </div>
  );
}
