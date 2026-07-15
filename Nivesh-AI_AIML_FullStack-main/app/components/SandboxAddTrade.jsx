'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';
import { useRealtimeRefresh } from '@/app/context/RealtimeContext';

/**
 * AddTradeModal Component
 * 
 * Modal for adding new trades
 * Shows:
 * - Asset selection (stocks, mutual funds, crypto)
 * - Trade details form
 * - Real-time trade input
 * - AI feedback and evaluation after submission
 */

export default function AddTradeModal({ userId, isOpen, onClose, onTradeAdded }) {
  const [step, setStep] = useState(1); // 1: input, 2: evaluation
  const [loading, setLoading] = useState(false);
  const [assetType, setAssetType] = useState('stock');
  const [tradeType, setTradeType] = useState('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState('');
  const { triggerRefresh } = useRealtimeRefresh();

  if (!isOpen) return null;

  const assetTypes = [
    { value: 'stock', label: '📈 Stocks', color: 'blue' },
    { value: 'mutual_fund', label: '💼 Mutual Funds', color: 'green' },
    { value: 'crypto', label: '₿ Cryptocurrency', color: 'yellow' },
  ];

  const handleAddTrade = async () => {
    if (!searchQuery || !quantity || !buyPrice) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tradeverse/trades/add/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: searchQuery,
          asset_type: assetType,
          trade_type: tradeType,
          quantity: parseFloat(quantity),
          buy_price: parseFloat(buyPrice),
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add trade');
      }

      const data = await response.json();
      setEvaluation(data);
      setStep(2);
      
      // Trigger real-time refresh for dashboard and leaderboard
      triggerRefresh();
      
      onTradeAdded?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedAsset(null);
    setQuantity('');
    setBuyPrice('');
    setNotes('');
    setEvaluation(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {step === 1 ? '➕ Add New Trade' : '✨ Trade Evaluation'}
          </h2>
          <button
            onClick={handleClose}
            className="hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {step === 1 ? (
            // Input Form
            <div className="space-y-6">
              {/* Asset Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Asset Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {assetTypes.map((at) => (
                    <button
                      key={at.value}
                      onClick={() => {
                        setAssetType(at.value);
                        setSelectedAsset(null);
                      }}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        assetType === at.value
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {at.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trade Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Trade Type
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'buy', label: '🔵 Buy', color: 'green' },
                    { value: 'sell', label: '🔴 Sell', color: 'red' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setTradeType(type.value)}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                        tradeType === type.value
                          ? type.value === 'buy'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asset Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Symbol/Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={
                      assetType === 'stock'
                        ? 'e.g., AAPL, TCS, INFY'
                        : assetType === 'crypto'
                        ? 'e.g., BTC, ETH'
                        : 'e.g., Axis Long Term...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                {searchQuery && (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">Selected: {searchQuery}</p>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="qty" className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  id="qty"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
                  Entry Price (₹) *
                </label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 150.50"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  placeholder="Why did you make this trade?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none resize-none"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTrade}
                  disabled={loading}
                  className={`flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    '🎯 Evaluate Trade'
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Evaluation Results
            evaluation && (
              <div className="space-y-6">
                {/* Feedback Badge */}
                <div className="text-center py-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                  <div
                    className={`text-5xl mb-2 ${
                      evaluation.evaluation.feedback === 'excellent'
                        ? '🎯'
                        : evaluation.evaluation.feedback === 'good'
                        ? '✅'
                        : evaluation.evaluation.feedback === 'neutral'
                        ? '➖'
                        : evaluation.evaluation.feedback === 'warning'
                        ? '⚠️'
                        : '❌'
                    }`}
                  />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {evaluation.evaluation.feedback.charAt(0).toUpperCase() +
                      evaluation.evaluation.feedback.slice(1)}{' '}
                    Trade!
                  </h3>
                  <p
                    className={`text-lg font-bold ${
                      evaluation.evaluation.points_awarded > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {evaluation.evaluation.points_awarded > 0 ? '+' : ''}
                    {evaluation.evaluation.points_awarded} points
                  </p>
                </div>

                {/* Feedback Summary */}
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3">AI Feedback</h4>
                  <div className="text-gray-700 whitespace-pre-line">
                    {evaluation.evaluation.summary}
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900">Detailed Analysis</h4>
                  {Object.entries(evaluation.evaluation.detailed_analysis).map(
                    ([key, details]) => (
                      <div
                        key={key}
                        className={`p-4 rounded-lg border-2 ${
                          details.score >= 60
                            ? 'bg-green-50 border-green-200'
                            : details.score >= 40
                            ? 'bg-blue-50 border-blue-200'
                            : details.score >= 20
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-gray-900 capitalize">
                            {key.replace(/_/g, ' ')}
                          </h5>
                          <span className="font-bold text-gray-700">{details.score}/100</span>
                        </div>
                        {details.message && (
                          <p className="text-sm text-gray-700">{details.message}</p>
                        )}
                      </div>
                    )
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg active:scale-95 transition"
                >
                  ✅ Done
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
