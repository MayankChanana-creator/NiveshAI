"""
AI Trade Evaluation Engine — NiveshAI TradeVerse
3-Phase evaluation: Pre-Trade | Live | Post-Trade + Behavioral Intelligence
Evaluates DECISIONS, not profits. Rewards discipline, consistency, risk management.
"""

from datetime import datetime
from typing import Optional, Dict, List, Tuple
from models.tradeverse import (
    StrategyType, TradeFeedback, BehavioralPattern,
    TradeVerseTrade, UserProfile, AIProfile, CreditTransaction
)
from services.realtime_market import RealTimeMarketService
import uuid


# ─────────────────────────────────────────────
# LEVEL THRESHOLDS (credit score based)
# ─────────────────────────────────────────────
LEVEL_THRESHOLDS = {
    "Beginner":     (0,    1200),
    "Intermediate": (1200, 1600),
    "Advanced":     (1600, 2200),
    "Pro":          (2200, 999999),
}

def get_level(credit_score: int) -> str:
    for level, (lo, hi) in LEVEL_THRESHOLDS.items():
        if lo <= credit_score < hi:
            return level
    return "Pro"

def get_next_level_info(credit_score: int) -> Tuple[str, int, float]:
    """Returns (next_level_name, points_needed, progress_pct)"""
    order = ["Beginner", "Intermediate", "Advanced", "Pro"]
    current = get_level(credit_score)
    idx = order.index(current)
    if idx >= len(order) - 1:
        return "Pro", 0, 100.0
    next_level = order[idx + 1]
    lo, hi = LEVEL_THRESHOLDS[current]
    progress = round(((credit_score - lo) / (hi - lo)) * 100, 1)
    return next_level, hi - credit_score, min(progress, 99.9)


class TradeEvaluator:
    """
    3-Phase AI Trade Evaluation Engine
    Phase 1: Pre-Trade Analysis (0-100)
    Phase 2: Live Trade Monitoring (0-100)
    Phase 3: Post-Trade Analysis (0-100)
    + Behavioral Score (0-100)
    Final = 0.3*pre + 0.3*live + 0.3*post + 0.1*behavioral
    """

    # ─── Asset intrinsic risk (neutral baseline, not bias) ───
    ASSET_RISK = {"stock": 55, "mutual_fund": 35, "crypto": 85}

    @staticmethod
    def evaluate_trade(
        trade: TradeVerseTrade,
        user_profile: UserProfile,
        ai_profile: AIProfile,
        historical_trades: List[TradeVerseTrade],
        market_data: Optional[Dict] = None,
    ) -> Tuple[int, TradeFeedback, Dict]:
        """
        Full 3-phase evaluation.
        Returns: (points_delta, TradeFeedback, detailed_analysis_dict)
        """

        # ── PHASE 1: Pre-Trade ──────────────────────────────
        pre = TradeEvaluator._phase1_pretrade(trade, user_profile, ai_profile, historical_trades)

        # ── PHASE 2: Live Monitoring ────────────────────────
        live = TradeEvaluator._phase2_live(trade, historical_trades)

        # ── PHASE 3: Post-Trade ─────────────────────────────
        post = TradeEvaluator._phase3_posttrade(trade, historical_trades)

        # ── BEHAVIORAL SCORE ────────────────────────────────
        behavioral = TradeEvaluator._behavioral_score(trade, historical_trades, user_profile)

        # ── FINAL SCORE ─────────────────────────────────────
        final = round(
            0.3 * pre["score"] +
            0.3 * live["score"] +
            0.3 * post["score"] +
            0.1 * behavioral["score"]
        )
        final = max(0, min(100, final))

        # ── LABEL ────────────────────────────────────────────
        if final >= 80:
            label = "Excellent"
            feedback = TradeFeedback.EXCELLENT
            points = 50
        elif final >= 60:
            label = "Good"
            feedback = TradeFeedback.GOOD
            points = 25
        elif final >= 40:
            label = "Average"
            feedback = TradeFeedback.NEUTRAL
            points = 0
        else:
            label = "Poor"
            feedback = TradeFeedback.POOR
            points = -50

        # ── MISTAKES & IMPROVEMENTS ─────────────────────────
        mistakes = []
        improvements = []
        for phase in [pre, live, post, behavioral]:
            mistakes.extend(phase.get("mistakes", []))
            improvements.extend(phase.get("improvements", []))
        mistakes = mistakes[:3]
        improvements = improvements[:3]

        # ── SUMMARY ─────────────────────────────────────────
        summary = TradeEvaluator._build_summary(final, label, trade, mistakes)

        # ── PATTERNS ────────────────────────────────────────
        patterns = behavioral.get("patterns", [])

        analysis = {
            # Legacy keys (used by existing portfolio evaluate endpoint)
            "goal_alignment":   {"score": pre["goal_score"],   "message": pre["goal_msg"],   "weight": 0.20},
            "risk_alignment":   {"score": pre["risk_score"],   "message": pre["risk_msg"],   "weight": 0.25},
            "diversification":  {"score": pre["div_score"],    "message": pre["div_msg"],    "weight": 0.15},
            "timing":           {"score": pre["timing_score"], "message": pre["timing_msg"], "weight": 0.15},
            "behavioral_check": {"score": behavioral["score"], "message": behavioral["msg"], "weight": 0.25},
            # New structured keys
            "phases": {
                "preTrade":   pre["score"],
                "live":       live["score"],
                "postTrade":  post["score"],
                "behavioral": behavioral["score"],
            },
            "finalScore":   final,
            "label":        label,
            "pointsChange": points,
            "summary":      summary,
            "mistakes":     mistakes,
            "improvements": improvements,
            "patterns":     patterns,
        }

        return points, feedback, analysis

    # ═══════════════════════════════════════════════════════
    # PHASE 1 — PRE-TRADE ANALYSIS
    # ═══════════════════════════════════════════════════════
    @staticmethod
    def _phase1_pretrade(
        trade: TradeVerseTrade,
        user_profile: UserProfile,
        ai_profile: AIProfile,
        historical_trades: List[TradeVerseTrade],
    ) -> Dict:
        mistakes, improvements = [], []

        # 1a. Goal Alignment
        goal_score, goal_msg = TradeEvaluator._goal_alignment(trade, user_profile)

        # 1b. Portfolio Risk Impact + Position Sizing
        risk_score, risk_msg = TradeEvaluator._risk_and_sizing(trade, ai_profile, user_profile, historical_trades)

        # 1c. Diversification Impact
        div_score, div_msg = TradeEvaluator._diversification(trade, historical_trades)

        # 1d. Market Context (asset-aware: crypto = 24/7)
        timing_score, timing_msg = TradeEvaluator._timing(trade)

        if goal_score < 40:
            mistakes.append("Trade doesn't align with your stated financial goal")
            improvements.append("Review your goal and pick assets that match it")
        if risk_score < 40:
            mistakes.append("Position risk exceeds your risk appetite")
            improvements.append("Reduce position size to 1–5% of your portfolio")
        if div_score < 40:
            mistakes.append("Portfolio is over-concentrated in one asset class")
            improvements.append("Add a different asset class to improve diversification")

        phase_score = round(
            0.25 * goal_score +
            0.30 * risk_score +
            0.25 * div_score +
            0.20 * timing_score
        )

        return {
            "score": max(0, min(100, phase_score)),
            "goal_score": goal_score, "goal_msg": goal_msg,
            "risk_score": risk_score, "risk_msg": risk_msg,
            "div_score":  div_score,  "div_msg":  div_msg,
            "timing_score": timing_score, "timing_msg": timing_msg,
            "mistakes": mistakes, "improvements": improvements,
        }

    # ═══════════════════════════════════════════════════════
    # PHASE 2 — LIVE TRADE MONITORING
    # ═══════════════════════════════════════════════════════
    @staticmethod
    def _phase2_live(trade: TradeVerseTrade, historical_trades: List[TradeVerseTrade]) -> Dict:
        mistakes, improvements = [], []
        score = 60  # neutral baseline

        pnl = trade.pnl or 0
        pnl_pct = trade.pnl_percent or 0

        # Unrealized PnL movement
        if pnl_pct >= 5:
            score += 20
        elif pnl_pct >= 0:
            score += 10
        elif pnl_pct >= -5:
            score -= 5
        else:
            score -= 20
            mistakes.append(f"Drawdown of {abs(pnl_pct):.1f}% — monitor stop-loss levels")
            improvements.append("Set a max drawdown threshold before entering trades")

        # Holding discipline — check if same symbol was panic-sold recently
        same_symbol_sells = [
            t for t in historical_trades[-10:]
            if t.symbol == trade.symbol and t.trade_type.value == "sell"
        ]
        if same_symbol_sells:
            score -= 10
            mistakes.append("Repeated buy-sell on same symbol suggests impulsive behavior")
            improvements.append("Define entry/exit criteria before placing a trade")

        # Strategy consistency
        if trade.notes and len(trade.notes) > 10:
            score += 5  # documented reasoning = discipline

        return {
            "score": max(0, min(100, score)),
            "mistakes": mistakes,
            "improvements": improvements,
        }

    # ═══════════════════════════════════════════════════════
    # PHASE 3 — POST-TRADE ANALYSIS
    # ═══════════════════════════════════════════════════════
    @staticmethod
    def _phase3_posttrade(trade: TradeVerseTrade, historical_trades: List[TradeVerseTrade]) -> Dict:
        mistakes, improvements = [], []
        score = 60

        pnl = trade.pnl or 0
        pnl_pct = trade.pnl_percent or 0
        invested = trade.quantity * trade.buy_price

        # Risk-adjusted return (NOT raw profit)
        asset_risk = TradeEvaluator.ASSET_RISK.get(trade.asset_type.value, 55)
        if asset_risk > 0:
            risk_adj = pnl_pct / (asset_risk / 100) if asset_risk else 0
        else:
            risk_adj = 0

        if risk_adj >= 10:
            score += 25
        elif risk_adj >= 3:
            score += 15
        elif risk_adj >= 0:
            score += 5
        else:
            score -= 15
            mistakes.append("Negative risk-adjusted return — loss not justified by risk taken")
            improvements.append("A losing trade can still be good if risk was managed — focus on process")

        # Entry quality: was this a new asset class or diversifying move?
        existing_symbols = [t.symbol for t in historical_trades]
        if trade.symbol not in existing_symbols:
            score += 10  # new position = good entry discipline

        # Exit quality: selling at profit vs panic
        if trade.trade_type.value == "sell":
            if pnl > 0:
                score += 10
            else:
                score -= 10
                mistakes.append("Exited at a loss — evaluate if this was planned or reactive")
                improvements.append("Use pre-defined stop-loss levels to avoid emotional exits")

        # Max drawdown impact
        if pnl_pct < -10:
            score -= 15
            mistakes.append("Trade caused >10% drawdown — position sizing may be too large")
            improvements.append("Limit single-trade exposure to 1–5% of total portfolio")

        return {
            "score": max(0, min(100, score)),
            "mistakes": mistakes,
            "improvements": improvements,
        }

    # ═══════════════════════════════════════════════════════
    # BEHAVIORAL SCORE
    # ═══════════════════════════════════════════════════════
    @staticmethod
    def _behavioral_score(
        trade: TradeVerseTrade,
        historical_trades: List[TradeVerseTrade],
        user_profile: UserProfile,
    ) -> Dict:
        score = 60
        mistakes, improvements = [], []
        patterns = []

        if not historical_trades:
            return {
                "score": 65,
                "msg": "First trade — building your behavioral baseline",
                "patterns": ["New Trader"],
                "mistakes": [], "improvements": [],
            }

        messages = []

        # 1. Position sizing discipline (ideal: 1–5% of portfolio)
        portfolio_value = sum(t.quantity * t.buy_price for t in historical_trades) or 1
        trade_size = trade.quantity * trade.buy_price
        size_pct = (trade_size / portfolio_value) * 100

        if 1 <= size_pct <= 5:
            score += 15
            messages.append(f"✅ Position size {size_pct:.1f}% — within ideal 1–5% range")
        elif size_pct <= 10:
            messages.append(f"⚠️ Position size {size_pct:.1f}% — slightly above ideal")
            score -= 5
        else:
            score -= 20
            mistakes.append(f"Oversized position: {size_pct:.1f}% of portfolio (ideal: 1–5%)")
            improvements.append("Reduce position size to protect against single-trade losses")
            patterns.append("Oversized Position")

        # 2. Overtrading detection
        recent_24h = [
            t for t in historical_trades[-20:]
            if (trade.timestamp - t.timestamp).total_seconds() < 86400
        ]
        if len(recent_24h) >= 7:
            score -= 25
            mistakes.append("7+ trades in 24 hours — overtrading detected")
            improvements.append("Limit to 2–3 high-conviction trades per day")
            patterns.append("Overtrading")
        elif len(recent_24h) >= 4:
            score -= 10
            messages.append("⚠️ High trading frequency today")
            patterns.append("High Frequency")

        # 3. Revenge trading (loss followed immediately by larger trade)
        if len(historical_trades) >= 2:
            last = historical_trades[0]
            last_size = last.quantity * last.buy_price
            if (last.trade_score or 0) < 0 and trade_size > last_size * 1.5:
                score -= 20
                mistakes.append("Larger trade after a loss — possible revenge trading")
                improvements.append("Take a break after losses; don't chase losses with bigger bets")
                patterns.append("Revenge Trading")

        # 4. Consistency with past trades
        if len(historical_trades) >= 5:
            recent_scores = [t.trade_score or 0 for t in historical_trades[:5]]
            positive = sum(1 for s in recent_scores if s > 0)
            win_rate = (positive / 5) * 100
            if win_rate >= 70:
                score += 15
                messages.append(f"🎯 Hot streak: {win_rate:.0f}% win rate (last 5)")
                patterns.append("Consistent Winner")
            elif win_rate <= 30:
                score -= 10
                messages.append(f"⚠️ Cold streak: {win_rate:.0f}% win rate (last 5)")
                patterns.append("Struggling — Review Strategy")

        # 5. Emotional control — panic sell detection
        if trade.trade_type.value == "sell":
            buys_same = [t for t in historical_trades if t.symbol == trade.symbol and t.trade_type.value == "buy"]
            if buys_same:
                avg_buy = sum(t.buy_price for t in buys_same) / len(buys_same)
                if trade.buy_price < avg_buy * 0.95:
                    score -= 15
                    mistakes.append("Selling below average buy price — possible panic sell")
                    improvements.append("Define exit rules before entering; don't sell on fear")
                    patterns.append("Panic Sell")

        # 6. Diversification consistency
        asset_types = set(t.asset_type.value for t in historical_trades[-10:])
        if len(asset_types) >= 3:
            score += 10
            messages.append(f"✅ Trading {len(asset_types)} asset classes — well diversified")
            patterns.append("Diversified Trader")
        elif len(asset_types) == 1:
            improvements.append("Explore other asset classes to reduce concentration risk")

        score = max(0, min(100, score))
        msg = " | ".join(messages) if messages else "Behavioral analysis complete"

        return {
            "score": score,
            "msg": msg,
            "patterns": list(set(patterns)),
            "mistakes": mistakes,
            "improvements": improvements,
        }

    # ═══════════════════════════════════════════════════════
    # HELPERS
    # ═══════════════════════════════════════════════════════
    @staticmethod
    def _goal_alignment(trade: TradeVerseTrade, user_profile: UserProfile) -> Tuple[int, str]:
        goal = user_profile.financial_goal.value
        asset = trade.asset_type.value
        horizon = user_profile.investment_horizon.value

        score = 50
        msgs = []

        if goal == "wealth_growth":
            if asset in ["stock", "mutual_fund"]:
                score = 70; msgs.append("✅ Aligns with long-term wealth growth")
            else:
                score = 45; msgs.append("⚠️ Crypto is volatile for wealth growth goals")
        elif goal == "short_term_profit":
            if asset == "crypto":
                score = 70; msgs.append("✅ Crypto volatility suits short-term profit goals")
            elif asset == "stock":
                score = 60; msgs.append("✅ Stocks can support short-term strategies")
            else:
                score = 40; msgs.append("⚠️ Mutual funds are slow for short-term profit")
        elif goal == "passive_income":
            if asset in ["stock", "mutual_fund"]:
                score = 75; msgs.append("✅ Good passive income asset")
            else:
                score = 20; msgs.append("❌ Crypto doesn't generate passive income")

        if horizon == "long":
            score = min(100, score + 10)
            msgs.append("✅ Long-term horizon supports patient investing")
        elif horizon == "short" and asset == "mutual_fund":
            score = max(0, score - 10)
            msgs.append("⚠️ Mutual funds need time to compound")

        return score, " | ".join(msgs)

    @staticmethod
    def _risk_and_sizing(
        trade: TradeVerseTrade,
        ai_profile: AIProfile,
        user_profile: UserProfile,
        historical_trades: List[TradeVerseTrade],
    ) -> Tuple[int, str]:
        asset_risk = TradeEvaluator.ASSET_RISK.get(trade.asset_type.value, 55)
        appetite = user_profile.risk_appetite.value
        msgs = []
        score = 50

        # Risk appetite alignment
        if appetite == "low":
            score = 70 if asset_risk <= 40 else 20
            msgs.append("✅ Safe asset for low risk appetite" if asset_risk <= 40 else "❌ Too risky for your low risk appetite")
        elif appetite == "medium":
            score = 65 if 30 <= asset_risk <= 65 else (45 if asset_risk < 30 else 35)
            msgs.append("✅ Balanced risk" if 30 <= asset_risk <= 65 else "⚠️ Risk mismatch with medium appetite")
        elif appetite == "high":
            score = 75 if asset_risk >= 50 else 55
            msgs.append("✅ High-risk asset suits your appetite" if asset_risk >= 50 else "⚠️ Could take more risk")

        # Profile deviation
        diff = abs(ai_profile.risk_score - asset_risk)
        if diff > 30:
            score -= 10
            msgs.append(f"⚠️ {diff}pt deviation from your AI risk profile")

        # Position sizing (1–5% ideal)
        portfolio_value = sum(t.quantity * t.buy_price for t in historical_trades) or 1
        trade_pct = (trade.quantity * trade.buy_price / portfolio_value) * 100
        if 1 <= trade_pct <= 5:
            score = min(100, score + 10)
            msgs.append(f"✅ Position size {trade_pct:.1f}% — ideal range")
        elif trade_pct > 20:
            score -= 20
            msgs.append(f"❌ Oversized: {trade_pct:.1f}% of portfolio")
        elif trade_pct > 10:
            score -= 10
            msgs.append(f"⚠️ Large position: {trade_pct:.1f}% of portfolio")

        return max(0, min(100, score)), " | ".join(msgs)

    @staticmethod
    def _diversification(trade: TradeVerseTrade, historical_trades: List[TradeVerseTrade]) -> Tuple[int, str]:
        if not historical_trades:
            return 65, "✅ First trade — diversification journey begins"

        asset_counts: Dict[str, int] = {}
        for t in historical_trades:
            v = t.asset_type.value
            asset_counts[v] = asset_counts.get(v, 0) + 1

        total = len(historical_trades) + 1
        current_count = asset_counts.get(trade.asset_type.value, 0) + 1
        concentration = current_count / total

        msgs = []
        if concentration <= 0.33:
            score = 75; msgs.append("✅ Well diversified portfolio")
        elif concentration <= 0.50:
            score = 55; msgs.append("⚠️ Moderate concentration")
        elif concentration <= 0.67:
            score = 35; msgs.append("❌ Heavy concentration risk")
        else:
            score = 15; msgs.append("❌ Very concentrated — high single-class risk")

        if trade.asset_type.value not in asset_counts:
            score = min(100, score + 15)
            msgs.append("✅ Adding new asset class — diversification bonus")

        return score, " | ".join(msgs)

    @staticmethod
    def _timing(trade: TradeVerseTrade) -> Tuple[int, str]:
        """Asset-aware timing: crypto is 24/7, stocks respect market hours"""
        msgs = []

        # Crypto: no market hours rule
        if trade.asset_type.value == "crypto":
            score = 70
            msgs.append("✅ Crypto trades 24/7 — timing is always valid")
        else:
            timing_analysis = RealTimeMarketService.analyze_trade_timing(
                trade.buy_price, trade.asset_type.value
            )
            score = timing_analysis.get("timing_score", 60)
            msgs.append(timing_analysis.get("reason", ""))

        # Volatility check
        try:
            volatility = RealTimeMarketService.get_market_volatility(trade.symbol)
            risk_level = volatility.get("risk_level", "medium")
            vol_pct = volatility.get("volatility_percent", 0)
            if risk_level == "low":
                score = min(100, score + 10)
                msgs.append(f"✅ Low volatility ({vol_pct}%) — good conditions")
            elif risk_level == "high":
                score = max(0, score - 15)
                msgs.append(f"❌ High volatility ({vol_pct}%) — risky entry")
            else:
                msgs.append(f"⚠️ Medium volatility ({vol_pct}%)")
        except Exception:
            pass

        return max(0, min(100, score)), " | ".join(filter(None, msgs))

    @staticmethod
    def _build_summary(final: int, label: str, trade: TradeVerseTrade, mistakes: List[str]) -> str:
        emoji = {"Excellent": "🎯", "Good": "✅", "Average": "➖", "Poor": "❌"}.get(label, "")
        base = f"{emoji} {label} trade decision on {trade.symbol} (Score: {final}/100)."
        if mistakes:
            base += f" Key issue: {mistakes[0].lower()}"
        return base

    # ─── Legacy compatibility ────────────────────────────────
    @staticmethod
    def generate_feedback_summary(analysis: Dict, points: int, feedback: TradeFeedback) -> str:
        return analysis.get("summary", f"Trade evaluated: {feedback.value} ({points:+d} pts)")
