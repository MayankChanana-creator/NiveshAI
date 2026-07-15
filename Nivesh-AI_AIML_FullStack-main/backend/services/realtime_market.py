"""
Real-Time Market Data Service
Provides live market data and timing analysis for trade evaluation
"""

import aiohttp
import asyncio
from datetime import datetime, time
from typing import Dict, Optional, List
import json
from enum import Enum


class MarketStatus(Enum):
    OPEN = "open"
    CLOSED = "closed"
    AFTER_HOURS = "after_hours"
    PRE_MARKET = "pre_market"


class RealTimeMarketService:
    """Handles real-time market data and timing analysis"""

    # Market hours (IST - India Standard Time)
    MARKET_HOURS = {
        "open": time(9, 15),  # 9:15 AM
        "close": time(15, 30),  # 3:30 PM
        "pre_market": (time(9, 0), time(9, 15)),
        "after_hours": (time(15, 30), time(16, 0)),
    }

    @staticmethod
    def get_current_market_status() -> Dict:
        """Get current market status and timing info"""
        now = datetime.now()
        current_time = now.time()
        day_of_week = now.weekday()

        # Check if market is open (Monday-Friday)
        is_weekday = day_of_week < 5

        if not is_weekday:
            status = MarketStatus.CLOSED
            reason = "Weekend"
        elif current_time < RealTimeMarketService.MARKET_HOURS["open"]:
            if RealTimeMarketService.MARKET_HOURS["pre_market"][0] <= current_time < RealTimeMarketService.MARKET_HOURS["pre_market"][1]:
                status = MarketStatus.PRE_MARKET
                reason = "Pre-market trading"
            else:
                status = MarketStatus.CLOSED
                reason = "Market not open yet"
        elif current_time > RealTimeMarketService.MARKET_HOURS["close"]:
            if RealTimeMarketService.MARKET_HOURS["after_hours"][0] <= current_time < RealTimeMarketService.MARKET_HOURS["after_hours"][1]:
                status = MarketStatus.AFTER_HOURS
                reason = "After-hours trading"
            else:
                status = MarketStatus.CLOSED
                reason = "Market closed"
        else:
            status = MarketStatus.OPEN
            reason = "Market is open"

        return {
            "status": status.value,
            "reason": reason,
            "current_time": now.isoformat(),
            "market_hours": {
                "open": RealTimeMarketService.MARKET_HOURS["open"].isoformat(),
                "close": RealTimeMarketService.MARKET_HOURS["close"].isoformat(),
            },
        }

    @staticmethod
    async def get_live_price(symbol: str, asset_type: str = "stock") -> Optional[Dict]:
        """
        Fetch live market price for a symbol
        In production, integrate with real APIs like:
        - Finnhub for stocks
        - CoinGecko for crypto
        - NSE API for mutual funds
        """
        try:
            # Mock data - in production, use real APIs
            mock_prices = {
                "stock": {
                    "TCS": {"price": 3850.75, "change": 1.2, "volume": 2500000},
                    "INFY": {"price": 1645.50, "change": -0.8, "volume": 1800000},
                    "AAPL": {"price": 245.30, "change": 2.1, "volume": 50000000},
                    "MSFT": {"price": 418.50, "change": 1.5, "volume": 30000000},
                },
                "crypto": {
                    "BTC": {"price": 47500.00, "change": 3.5, "volume": 25000000000},
                    "ETH": {"price": 2850.50, "change": 2.8, "volume": 15000000000},
                },
                "mutual_fund": {
                    "AXIS_LONG_TERM": {"price": 45.80, "change": 0.5, "volume": 100000},
                    "HDFC_GROWTH": {"price": 62.30, "change": 0.8, "volume": 150000},
                },
            }

            asset_data = mock_prices.get(asset_type, {})
            price_data = asset_data.get(symbol.upper())

            if price_data:
                return {
                    "symbol": symbol.upper(),
                    "asset_type": asset_type,
                    "current_price": price_data["price"],
                    "change_percent": price_data["change"],
                    "volume": price_data["volume"],
                    "timestamp": datetime.now().isoformat(),
                    "status": "live",
                }
            return None

        except Exception as e:
            print(f"Error fetching price for {symbol}: {e}")
            return None

    @staticmethod
    def analyze_trade_timing(entry_price: float, asset_type: str = "stock") -> Dict:
        """
        Analyze trade timing based on market conditions
        Returns timing score and reasoning
        """
        market_status = RealTimeMarketService.get_current_market_status()
        status = market_status["status"]

        timing_score = 0
        timing_reason = ""

        if status == MarketStatus.OPEN.value:
            timing_score = 90
            timing_reason = "✅ Excellent: Trading during market hours with high liquidity"
        elif status == MarketStatus.PRE_MARKET.value:
            timing_score = 60
            timing_reason = "⚠️ Caution: Pre-market trading - lower liquidity and wider spreads"
        elif status == MarketStatus.AFTER_HOURS.value:
            timing_score = 50
            timing_reason = "⚠️ Caution: After-hours trading - very low liquidity"
        else:
            timing_score = 20
            timing_reason = "❌ Poor: Market is closed - this is a simulated trade"

        return {
            "timing_score": timing_score,
            "reason": timing_reason,
            "market_status": status,
            "price_point": entry_price,
        }

    @staticmethod
    def get_market_volatility(symbol: str) -> Dict:
        """
        Get market volatility index for symbol
        Used to assess risk of trade timing
        """
        # Mock volatility data
        volatility_data = {
            "TCS": 2.1,
            "INFY": 1.8,
            "AAPL": 3.2,
            "MSFT": 2.8,
            "BTC": 5.2,
            "ETH": 4.8,
        }

        volatility = volatility_data.get(symbol.upper(), 2.5)

        return {
            "symbol": symbol.upper(),
            "volatility_percent": volatility,
            "risk_level": "high" if volatility > 4 else "medium" if volatility > 2.5 else "low",
            "timestamp": datetime.now().isoformat(),
        }

    @staticmethod
    def calculate_optimal_entry_window(asset_type: str, risk_profile: str) -> Dict:
        """
        Calculate optimal trading window based on asset type and risk profile
        """
        market_status = RealTimeMarketService.get_current_market_status()

        windows = {
            "conservative": {
                "description": "Mid-market hours (10:30-15:00) with higher liquidity",
                "optimal_time": "10:30-15:00",
                "avoid": "First 15 minutes and last 30 minutes of market",
            },
            "balanced": {
                "description": "Normal market hours (9:15-15:30) with standard liquidity",
                "optimal_time": "9:15-15:30",
                "avoid": "Highly volatile periods",
            },
            "aggressive": {
                "description": "Any market hours, including pre/after market",
                "optimal_time": "9:00-16:00",
                "avoid": "None - comfortable with volatility",
            },
        }

        window = windows.get(risk_profile, windows["balanced"])

        return {
            "risk_profile": risk_profile,
            **window,
            "current_market_status": market_status["status"],
            "is_optimal_time": market_status["status"] == MarketStatus.OPEN.value,
        }
