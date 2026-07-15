"use client";
import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

function formatPct(val) {
  return isNaN(val) ? "--" : (val * 100).toFixed(2) + "%";
}

function formatRs(val) {
  return isNaN(val) ? "--" : "₹" + Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrency(val, symbol = "$") {
  return isNaN(val) ? "--" : symbol + Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Custom Tooltip for the chart
function CustomTooltip({ active, payload, label, currencySymbol }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#1a1f35]/95 backdrop-blur-sm border border-cyan-800/40 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {currencySymbol === "₹" ? formatRs(entry.value) : formatCurrency(entry.value, currencySymbol)}
        </p>
      ))}
    </div>
  );
}

export default function TradePredictionContent({ monteCarlo, riskVolatility, currencySymbol = "₹", priceLabel = "Price", assetType = "stock" }) {
  // Calculate derived values
  const lastPrice = monteCarlo?.last_price || monteCarlo?.last_nav || 0;
  const expectedPrice = monteCarlo?.expected_price || monteCarlo?.expected_nav || 0;
  const probPositive = monteCarlo?.probability_positive_return || 0;
  const lower5 = monteCarlo?.lower_bound_5th_percentile || 0;
  const upper95 = monteCarlo?.upper_bound_95th_percentile || 0;
  
  // Expected return
  const expectedReturn = lastPrice > 0 ? ((expectedPrice - lastPrice) / lastPrice) * 100 : 0;
  
  // Best case return (95th percentile)
  const bestCaseReturn = lastPrice > 0 ? ((upper95 - lastPrice) / lastPrice) * 100 : 0;
  
  // Worst case return (5th percentile)
  const worstCaseReturn = lastPrice > 0 ? ((lower5 - lastPrice) / lastPrice) * 100 : 0;

  const formatVal = (val) => {
    if (currencySymbol === "₹") return formatRs(val);
    return formatCurrency(val, currencySymbol);
  };

  // Build enhanced chart data
  const hasSimPaths = monteCarlo?.simulation_paths?.length > 0;
  const historicalPredicted = monteCarlo?.historical_predicted || [];

  // Build area chart data for best/worst/expected range visualization
  const areaChartData = [
    { name: "Current Price", expected: lastPrice, best: lastPrice, worst: lastPrice, label: "Now" },
    { name: "3 Months", expected: lastPrice + (expectedPrice - lastPrice) * 0.25, best: lastPrice + (upper95 - lastPrice) * 0.25, worst: lastPrice + (lower5 - lastPrice) * 0.25, label: "3M" },
    { name: "6 Months", expected: lastPrice + (expectedPrice - lastPrice) * 0.5, best: lastPrice + (upper95 - lastPrice) * 0.5, worst: lastPrice + (lower5 - lastPrice) * 0.5, label: "6M" },
    { name: "9 Months", expected: lastPrice + (expectedPrice - lastPrice) * 0.75, best: lastPrice + (upper95 - lastPrice) * 0.75, worst: lastPrice + (lower5 - lastPrice) * 0.75, label: "9M" },
    { name: "1 Year", expected: expectedPrice, best: upper95, worst: lower5, label: "1Y" },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Stats Grid - 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profit Probability */}
        <div className="bg-[#111827] border border-gray-700/50 rounded-xl p-5 h-full relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Profit Probability</span>
            <span className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">%</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mb-2">
            {probPositive.toFixed(1)}%
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(probPositive, 100)}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            {probPositive > 60 ? "Strong bullish signal" : probPositive > 40 ? "Moderate outlook" : "High risk detected"}
          </p>
        </div>

        {/* Expected Return */}
        <div className="bg-[#111827] border border-gray-700/50 rounded-xl p-5 h-full relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l-xl"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expected Return</span>
            <span className="w-7 h-7 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-[10px] font-bold">E[R]</span>
          </div>
          <div className={`text-3xl font-extrabold ${expectedReturn >= 0 ? 'text-cyan-400' : 'text-red-400'} mb-2`}>
            {expectedReturn >= 0 ? '+' : ''}{expectedReturn.toFixed(1)}%
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-500">Expected Price</span>
            <span className="text-sm font-bold text-white">{formatVal(expectedPrice)}</span>
          </div>
        </div>

        {/* Best Case (95th percentile) */}
        <div className="bg-[#111827] border border-gray-700/50 rounded-xl p-5 h-full relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-xl"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Best Case</span>
            <span className="w-7 h-7 rounded-md bg-green-500/10 text-green-400 flex items-center justify-center text-xs font-bold">P95</span>
          </div>
          <div className="text-3xl font-extrabold text-green-400 mb-2">
            {bestCaseReturn >= 0 ? '+' : ''}{bestCaseReturn.toFixed(1)}%
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-500">95th Percentile</span>
            <span className="text-sm font-bold text-white">{formatVal(upper95)}</span>
          </div>
        </div>

        {/* Worst Case (5th percentile) */}
        <div className="bg-[#111827] border border-gray-700/50 rounded-xl p-5 h-full relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Worst Case</span>
            <span className="w-7 h-7 rounded-md bg-red-500/10 text-red-400 flex items-center justify-center text-xs font-bold">P5</span>
          </div>
          <div className="text-3xl font-extrabold text-red-400 mb-2">
            {worstCaseReturn.toFixed(1)}%
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-500">5th Percentile</span>
            <span className="text-sm font-bold text-white">{formatVal(lower5)}</span>
          </div>
        </div>
      </div>

      {/* Price Summary Row */}
      <div className="bg-[#0d1225] border border-gray-700/40 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Current Price</p>
              <p className="text-lg font-bold text-white">{formatVal(lastPrice)}</p>
            </div>
          </div>
          <div className="hidden md:block w-px h-10 bg-gray-700"></div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Predicted Price (1Y)</p>
              <p className="text-lg font-bold text-cyan-400">{formatVal(expectedPrice)}</p>
            </div>
          </div>
          <div className="hidden md:block w-px h-10 bg-gray-700"></div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Best Case (1Y)</p>
              <p className="text-lg font-bold text-green-400">{formatVal(upper95)}</p>
            </div>
          </div>
          <div className="hidden md:block w-px h-10 bg-gray-700"></div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Worst Case (1Y)</p>
              <p className="text-lg font-bold text-red-400">{formatVal(lower5)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#0d1225] border border-gray-700/40 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Price Prediction Range</h3>
            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-medium">1 Year Forecast</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-cyan-400"></div>
              <span className="text-gray-400">Expected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-green-400/50"></div>
              <span className="text-gray-400">Best Case</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-red-400/50"></div>
              <span className="text-gray-400">Worst Case</span>
            </div>
          </div>
        </div>
        
        <div className="h-[320px] w-full">
          {expectedPrice ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="bestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="expectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="worstGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => currencySymbol === "₹" ? '₹' + Number(val).toLocaleString('en-IN', {maximumFractionDigits: 0}) : '$' + Number(val).toLocaleString('en-US', {maximumFractionDigits: 2})}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
                <ReferenceLine y={lastPrice} stroke="#64748b" strokeDasharray="6 4" strokeWidth={1} />
                <Area
                  type="monotone"
                  dataKey="best"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#bestGrad)"
                  name="Best Case"
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#0d1225' }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#0d1225' }}
                />
                <Area
                  type="monotone"
                  dataKey="expected"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fill="url(#expectedGrad)"
                  name="Expected"
                  dot={{ fill: '#06b6d4', r: 5, strokeWidth: 2, stroke: '#0d1225' }}
                  activeDot={{ r: 7, stroke: '#06b6d4', strokeWidth: 2, fill: '#0d1225' }}
                />
                <Area
                  type="monotone"
                  dataKey="worst"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#worstGrad)"
                  name="Worst Case"
                  dot={{ fill: '#ef4444', r: 4, strokeWidth: 2, stroke: '#0d1225' }}
                  activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#0d1225' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">No prediction data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Paths Chart (if available) */}
      {hasSimPaths && (
        <div className="bg-[#0d1225] border border-gray-700/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Simulation Paths</h3>
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">Monte Carlo</span>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalPredicted} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  label={{ value: 'Trading Days', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => currencySymbol === "₹" ? '₹' + val.toFixed(0) : '$' + val.toFixed(2)}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ background: "#1a1f35", border: "1px solid rgba(34,211,238,0.2)", borderRadius: "12px" }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} iconType="line" />
                
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  data={historicalPredicted}
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={false}
                  name="Historical + Predicted"
                />
                
                {monteCarlo.simulation_paths?.map((sim, idx) => (
                  <Line
                    key={sim.name}
                    type="monotone"
                    dataKey="value"
                    data={sim.data}
                    stroke={
                      idx === 0 ? "#10b981" :
                      idx === 1 ? "#14b8a6" :
                      idx === 2 ? "#06b6d4" :
                      "#3b82f6"
                    }
                    strokeWidth={1}
                    dot={false}
                    name={sim.name}
                    opacity={0.6}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-2">
        <svg className="w-4 h-4 text-amber-500/60 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-xs text-gray-500 italic leading-relaxed">
          Predictions are based on historical data analysis and Monte Carlo simulation with 1,000+ scenarios. Past performance does not guarantee future results. This is not financial advice.
        </p>
      </div>
    </div>
  );
}
