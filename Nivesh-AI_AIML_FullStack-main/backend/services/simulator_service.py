"""
Simulator Service — models different investor behaviour patterns
against historical price data.

Behaviours:
  - panic:   Sells on any drop > 2%, buys on +5% momentum
  - calm:    Buy-and-hold with minor rebalancing on large swings
  - greedy:  Aggressive buying on dips, holds through everything
  - neutral: Simple buy-and-hold (baseline benchmark)
"""

import pandas as pd
import numpy as np


def simulate_behaviour(history_data: list, behaviour: str, initial_investment: float) -> list:
    """
    Simulates a trading behaviour over historical price data.

    Args:
        history_data: list of {"date": str, "close": float}
        behaviour:    'panic' | 'calm' | 'greedy' | 'neutral'
        initial_investment: starting capital

    Returns:
        list of daily snapshots with portfolio_value, cash, shares, action, volatility, is_anomaly
    """
    if not history_data or len(history_data) < 2:
        return []

    closes = [d["close"] for d in history_data]
    dates = [d["date"] for d in history_data]

    # Calculate daily returns for volatility
    returns = pd.Series(closes).pct_change().fillna(0).tolist()

    # Rolling volatility (20-day window)
    vol_series = pd.Series(returns).rolling(window=20, min_periods=1).std().fillna(0).tolist()

    # Detect anomalies (daily return > 2 std devs from rolling mean)
    rolling_mean = pd.Series(returns).rolling(window=20, min_periods=1).mean().fillna(0).tolist()
    rolling_std = pd.Series(returns).rolling(window=20, min_periods=1).std().fillna(0.01).tolist()

    cash = initial_investment
    shares = 0
    first_price = closes[0]

    results = []

    for i in range(len(closes)):
        price = closes[i]
        daily_return = returns[i]
        volatility = vol_series[i]
        is_anomaly = abs(daily_return - rolling_mean[i]) > 2 * max(rolling_std[i], 0.005)

        action = "HOLD"

        if behaviour == "neutral":
            # Buy-and-hold: invest everything on day 0
            if i == 0 and cash > 0:
                buy_qty = int(cash // price)
                if buy_qty > 0:
                    cash -= buy_qty * price
                    shares += buy_qty
                    action = "BUY"

        elif behaviour == "panic":
            # Panic seller: sells on any drop > 2%, buys back cautiously after +5% recovery
            if daily_return < -0.02 and shares > 0:
                # Sell everything on panic
                sell_qty = shares
                cash += sell_qty * price
                shares = 0
                action = "SELL"
            elif daily_return > 0.05 and shares == 0 and cash > price:
                # Cautious re-entry after big rally
                buy_qty = int(cash * 0.5 // price)
                if buy_qty > 0:
                    cash -= buy_qty * price
                    shares += buy_qty
                    action = "BUY"
            elif i == 0 and cash > 0:
                buy_qty = int(cash // price)
                if buy_qty > 0:
                    cash -= buy_qty * price
                    shares += buy_qty
                    action = "BUY"

        elif behaviour == "calm":
            # Calm investor: buys initially, only sells if drop > 15% from peak
            if i == 0 and cash > 0:
                buy_qty = int(cash * 0.7 // price)
                if buy_qty > 0:
                    cash -= buy_qty * price
                    shares += buy_qty
                    action = "BUY"
            elif i > 0:
                peak = max(closes[:i+1])
                drawdown = (peak - price) / peak if peak > 0 else 0
                if drawdown > 0.15 and shares > 0:
                    # Sell 30% of holdings to reduce risk
                    sell_qty = max(1, int(shares * 0.3))
                    cash += sell_qty * price
                    shares -= sell_qty
                    action = "SELL"
                elif drawdown < 0.05 and cash > price * 5:
                    # Buy more when near highs (DCA-like)
                    buy_qty = int(cash * 0.1 // price)
                    if buy_qty > 0:
                        cash -= buy_qty * price
                        shares += buy_qty
                        action = "BUY"

        elif behaviour == "greedy":
            # Greedy trader: buys aggressively on dips, never sells
            if i == 0 and cash > 0:
                buy_qty = int(cash * 0.9 // price)
                if buy_qty > 0:
                    cash -= buy_qty * price
                    shares += buy_qty
                    action = "BUY"
            elif daily_return < -0.03 and cash > price:
                # Buy the dip aggressively
                buy_qty = int(cash * 0.5 // price)
                if buy_qty > 0:
                    cash -= buy_qty * price
                    shares += buy_qty
                    action = "BUY"

        portfolio_value = cash + (shares * price)

        results.append({
            "date": dates[i],
            "close": round(price, 2),
            "cash": round(cash, 2),
            "shares": shares,
            "portfolio_value": round(portfolio_value, 2),
            "action": action,
            "daily_return": round(daily_return * 100, 4),
            "volatility": round(volatility * 100, 4),
            "is_anomaly": is_anomaly
        })

    return results
