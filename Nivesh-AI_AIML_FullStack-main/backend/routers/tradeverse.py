"""
TradeVerse Trading System API Routes
Endpoints for onboarding, trades, leaderboard, and feedback
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
import uuid
import sqlite3
from typing import Optional, List

def _get_live_price(symbol: str) -> float:
    """Fetch real-time price via yfinance. Falls back to 100 if unavailable."""
    try:
        import yfinance as yf
        info = yf.Ticker(symbol).info
        price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("previousClose")
        return float(price) if price else 100.0
    except Exception:
        return 100.0

from models.tradeverse import (
    InvestorProfileInput, UserProfile, AIProfile, TradeVerseTrade, 
    AddTradeInput, TradeEvaluation, AIProfileResponse, UserTradeVerseDashboard,
    LeaderboardResponse, CreditTransaction, AssetType
)
from services.tradeverse_db import TradeVerseDB
from services.trade_evaluator import TradeEvaluator, get_level, get_next_level_info
from services.ai_profile_initializer import AIProfileInitializer
from services.realtime_market import RealTimeMarketService

router = APIRouter(prefix="/api/tradeverse", tags=["TradeVerse Trading"])


# ============ ONBOARDING ENDPOINTS ============

@router.get("/onboarding/prompts")
def get_onboarding_prompts():
    """Get structured prompts for user onboarding form"""
    return AIProfileInitializer.get_onboarding_prompts()


@router.post("/onboarding/complete/{user_id}")
def complete_onboarding(user_id: str, profile_input: InvestorProfileInput):
    """
    Complete user onboarding and create AI profile
    
    Steps:
    1. Create user profile with onboarding data
    2. Generate AI profile (risk score, strategy, level)
    3. Save both to database
    4. Return initialized AI profile
    """
    
    try:
        # Check if user already has profile
        existing = TradeVerseDB.get_user_profile(user_id)
        if existing:
            raise HTTPException(status_code=400, detail="User already onboarded")
        
        # Create user profile
        user_profile = UserProfile(
            user_id=user_id,
            email=f"user_{user_id}@niveshai.com",  # Placeholder, should come from auth
            financial_goal=profile_input.financial_goal,
            investment_horizon=profile_input.investment_horizon,
            risk_appetite=profile_input.risk_appetite,
            monthly_budget=profile_input.monthly_budget,
            experience_level=profile_input.experience_level,
            education_level=profile_input.education_level,
            age=profile_input.age,
            country=profile_input.country,
            college_name=profile_input.college_name,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Save user profile
        success = TradeVerseDB.create_user_profile(user_profile)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to create user profile")
        
        # Generate AI profile
        ai_profile = AIProfileInitializer.create_ai_profile_from_user(user_id, profile_input)
        
        # Save AI profile
        success = TradeVerseDB.create_ai_profile(ai_profile)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to create AI profile")
        
        # Get strategy recommendations
        strategy_recs = AIProfileInitializer.get_strategy_recommendations(ai_profile.strategy_type)
        
        return {
            "message": "Onboarding completed successfully!",
            "ai_profile": AIProfileResponse(
                user_id=ai_profile.user_id,
                risk_score=ai_profile.risk_score,
                strategy_type=ai_profile.strategy_type.value,
                level=ai_profile.level.value,
                credit_score=ai_profile.credit_score,
                consistency_score=ai_profile.consistency_score,
                trades_count=ai_profile.trades_count,
                next_level_threshold=2000 if ai_profile.credit_score < 2000 else 9999,
                points_to_next_level=max(0, 2000 - ai_profile.credit_score) if ai_profile.credit_score < 2000 else 0
            ),
            "strategy_recommendations": strategy_recs,
            "level_thresholds": AIProfileInitializer.get_level_thresholds()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/profile/{user_id}")
def get_user_profile(user_id: str):
    """Get user's profile and AI profile"""
    
    user_profile = TradeVerseDB.get_user_profile(user_id)
    ai_profile = TradeVerseDB.get_ai_profile(user_id)
    
    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not ai_profile:
        raise HTTPException(status_code=404, detail="AI profile not initialized")
    
    return {
        "user_profile": user_profile,
        "ai_profile": AIProfileResponse(
            user_id=ai_profile.user_id,
            risk_score=ai_profile.risk_score,
            strategy_type=ai_profile.strategy_type.value,
            level=ai_profile.level.value,
            credit_score=ai_profile.credit_score,
            consistency_score=ai_profile.consistency_score,
            trades_count=ai_profile.trades_count,
            next_level_threshold=2000 if ai_profile.credit_score < 2000 else 9999,
            points_to_next_level=max(0, 2000 - ai_profile.credit_score) if ai_profile.credit_score < 2000 else 0
        )
    }


# ============ TRADE ENDPOINTS ============

@router.post("/trades/add/{user_id}")
def add_trade(user_id: str, trade_input: AddTradeInput):
    """
    Add new trade to sandbox portfolio
    
    Triggers:
    1. Save trade to database
    2. AI evaluation
    3. Credit update
    4. Level check
    5. Feedback generation
    """
    
    try:
        # Verify user exists
        user_profile = TradeVerseDB.get_user_profile(user_id)
        ai_profile = TradeVerseDB.get_ai_profile(user_id)
        
        if not user_profile or not ai_profile:
            raise HTTPException(status_code=404, detail="User not found or not onboarded")
        
        # Create trade object
        trade_id = f"trade_{user_id}_{int(datetime.now().timestamp())}"
        trade = TradeVerseTrade(
            trade_id=trade_id,
            user_id=user_id,
            symbol=trade_input.symbol,
            asset_type=trade_input.asset_type,
            trade_type=trade_input.trade_type,
            quantity=trade_input.quantity,
            buy_price=trade_input.buy_price,
            timestamp=trade_input.timestamp or datetime.now(),
            notes=trade_input.notes
        )
        
        # Get historical trades for analysis
        historical_trades = TradeVerseDB.get_user_trades(user_id, limit=50)
        
        # AI Evaluation
        points, feedback, analysis = TradeEvaluator.evaluate_trade(
            trade=trade,
            user_profile=user_profile,
            ai_profile=ai_profile,
            historical_trades=historical_trades,
            market_data=None
        )
        
        # Add evaluation results to trade
        trade.trade_score = points
        trade.ai_feedback = feedback.value
        trade.evaluation_metrics = analysis
        
        # Save trade
        success = TradeVerseDB.add_trade(trade)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to save trade")
        
        # Record credit transaction
        transaction = CreditTransaction(
            transaction_id=f"txn_{uuid.uuid4()}",
            user_id=user_id,
            trade_id=trade_id,
            amount=points,
            reason=f"Trade evaluation: {feedback.value}",
            timestamp=datetime.now()
        )
        TradeVerseDB.add_credit_transaction(transaction)
        
        # Check and update level
        TradeVerseDB.update_ai_profile_level(user_id)
        
        # Get updated profile
        updated_ai_profile = TradeVerseDB.get_ai_profile(user_id)
        
        # Generate detailed feedback
        feedback_summary = TradeEvaluator.generate_feedback_summary(analysis, points, feedback)
        
        return {
            "message": "Trade added successfully",
            "trade": trade,
            "evaluation": {
                "feedback": feedback.value,
                "points_awarded": points,
                "summary": feedback_summary,
                "detailed_analysis": analysis
            },
            "updated_profile": {
                "credit_score": updated_ai_profile.credit_score,
                "level": updated_ai_profile.level.value,
                "trades_count": updated_ai_profile.trades_count + 1
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/trades/{user_id}")
def get_user_trades(user_id: str, limit: int = Query(50, le=100)):
    """Get all trades for a user"""
    
    user_profile = TradeVerseDB.get_user_profile(user_id)
    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    trades = TradeVerseDB.get_user_trades(user_id, limit=limit)
    
    # Calculate summary stats
    total_pnl = sum(t.pnl or 0 for t in trades if t.pnl)
    winning_trades = sum(1 for t in trades if t.pnl and t.pnl > 0)
    total_points = sum(t.trade_score for t in trades)
    
    return {
        "trades": trades,
        "summary": {
            "total_trades": len(trades),
            "total_pnl": total_pnl,
            "winning_trades": winning_trades,
            "win_rate": (winning_trades / len(trades) * 100) if trades else 0,
            "total_points_earned": total_points,
            "avg_points_per_trade": (total_points / len(trades)) if trades else 0
        }
    }


@router.get("/dashboard/{user_id}")
def get_user_dashboard(user_id: str):
    """
    Full structured dashboard — returns spec-compliant JSON for the frontend UI.
    Includes creditScore, riskScore, level, nextLevelProgress, portfolioValue,
    totalPnL, winRate, totalTrades, latestTradeFeedback, and patterns.
    """

    user_profile = TradeVerseDB.get_user_profile(user_id)
    ai_profile = TradeVerseDB.get_ai_profile(user_id)

    if not user_profile or not ai_profile:
        raise HTTPException(status_code=404, detail="User not found")

    trades = TradeVerseDB.get_user_trades(user_id, limit=100)

    # ── Core metrics ────────────────────────────────────────
    credit_score   = ai_profile.credit_score
    level          = get_level(credit_score)
    next_level, pts_needed, progress = get_next_level_info(credit_score)

    portfolio_value = sum(t.quantity * t.buy_price for t in trades)
    total_pnl       = sum(t.pnl or 0 for t in trades)
    total_trades    = len(trades)
    winning_trades  = sum(1 for t in trades if (t.pnl or 0) > 0)
    win_rate        = round((winning_trades / total_trades * 100), 1) if total_trades else 0.0

    # ── Risk score: blend of asset risk + position sizing ───
    if trades:
        asset_risk_map = {"stock": 55, "mutual_fund": 35, "crypto": 85}
        avg_asset_risk = sum(
            asset_risk_map.get(t.asset_type.value, 55) for t in trades
        ) / total_trades
        risk_score = round(min(100, avg_asset_risk * 0.6 + ai_profile.risk_score * 0.4))
    else:
        risk_score = ai_profile.risk_score

    # ── Latest trade feedback ────────────────────────────────
    latest_feedback_payload = None
    if trades:
        latest = trades[0]
        metrics = latest.evaluation_metrics or {}
        phases  = metrics.get("phases", {})
        final_score = metrics.get("finalScore", 0)
        label = metrics.get("label", "Average")

        # Map label → pointsChange
        label_points = {"Excellent": 50, "Good": 25, "Average": 0, "Poor": -50}

        latest_feedback_payload = {
            "asset":       latest.symbol,
            "finalScore":  final_score,
            "label":       label,
            "pointsChange": metrics.get("pointsChange", label_points.get(label, 0)),
            "summary":     metrics.get("summary", latest.ai_feedback or ""),
            "breakdown": {
                "preTrade":   phases.get("preTrade",   0),
                "live":       phases.get("live",       0),
                "postTrade":  phases.get("postTrade",  0),
                "behavior":   phases.get("behavioral", 0),
            },
            "mistakes":     metrics.get("mistakes",     []),
            "improvements": metrics.get("improvements", []),
        }

    # ── Behavioral patterns ──────────────────────────────────
    raw_patterns = TradeVerseDB.get_behavioral_patterns(user_id)
    pattern_strings = [
        f"{k} (×{v['count']})" for k, v in raw_patterns.items()
    ] if raw_patterns else ["No patterns detected yet"]

    # ── Recent feedback (legacy UI support) ─────────────────
    recent_feedback = [
        {
            "trade_id":  t.trade_id,
            "symbol":    t.symbol,
            "feedback":  t.ai_feedback,
            "points":    t.trade_score,
            "timestamp": t.timestamp,
            "finalScore":   (t.evaluation_metrics or {}).get("finalScore", 0),
            "label":        (t.evaluation_metrics or {}).get("label", "Average"),
            "breakdown":    (t.evaluation_metrics or {}).get("phases", {}),
            "mistakes":     (t.evaluation_metrics or {}).get("mistakes", []),
            "improvements": (t.evaluation_metrics or {}).get("improvements", []),
        }
        for t in trades[:10]
    ]

    return {
        # ── Spec-required top-level fields ──
        "creditScore":        credit_score,
        "riskScore":          risk_score,
        "level":              level,
        "nextLevelProgress":  progress,
        "portfolioValue":     round(portfolio_value, 2),
        "totalPnL":           round(total_pnl, 2),
        "winRate":            win_rate,
        "totalTrades":        total_trades,
        "latestTradeFeedback": latest_feedback_payload,
        "patterns":           pattern_strings,

        # ── Legacy fields (existing frontend components) ──
        "user_profile": user_profile,
        "ai_profile": AIProfileResponse(
            user_id=ai_profile.user_id,
            risk_score=risk_score,
            strategy_type=ai_profile.strategy_type.value,
            level=level,
            credit_score=credit_score,
            consistency_score=ai_profile.consistency_score,
            trades_count=total_trades,
            next_level_threshold=credit_score + pts_needed,
            points_to_next_level=pts_needed,
        ),
        "trades": trades,
        "portfolio_metrics": {
            "total_value":    round(portfolio_value, 2),
            "total_pnl":      round(total_pnl, 2),
            "total_trades":   total_trades,
            "winning_trades": winning_trades,
        },
        "recent_feedback":    recent_feedback,
        "behavioral_patterns": raw_patterns,
    }


# ============ LEADERBOARD ENDPOINTS ============

@router.get("/leaderboard/global")
def get_global_leaderboard(limit: int = Query(100, le=500)):
    """Get global leaderboard"""
    
    entries = TradeVerseDB.get_global_leaderboard(limit=limit)
    
    if not entries:
        raise HTTPException(status_code=404, detail="No leaderboard data available")
    
    return LeaderboardResponse(
        leaderboard_type="global",
        entries=entries,
        user_rank=len(entries),
        user_score=0
    )


@router.get("/leaderboard/college/{college_name}")
def get_college_leaderboard(college_name: str, limit: int = Query(100, le=500)):
    """Get college-specific leaderboard"""
    
    entries = TradeVerseDB.get_college_leaderboard(college_name, limit=limit)
    
    if not entries:
        raise HTTPException(status_code=404, detail=f"No data for {college_name}")
    
    return LeaderboardResponse(
        leaderboard_type="college",
        entries=entries,
        user_rank=len(entries),
        user_score=0
    )


@router.get("/leaderboard/global/user-rank/{user_id}")
def get_user_global_rank(user_id: str):
    """Get user's rank in global leaderboard"""
    
    leaderboard = TradeVerseDB.get_global_leaderboard(limit=10000)
    
    user_rank = None
    user_entry = None
    
    for idx, entry in enumerate(leaderboard, 1):
        if entry.user_id == user_id:
            user_rank = idx
            user_entry = entry
            break
    
    if not user_entry:
        raise HTTPException(status_code=404, detail="User not found in leaderboard")
    
    return {
        "rank": user_rank,
        "entry": user_entry,
        "top_10": [e.dict() for e in leaderboard[:10]]
    }


# ============ LEARNING & FEEDBACK ENDPOINTS ============

@router.get("/behavioral-patterns/{user_id}")
def get_behavioral_patterns(user_id: str):
    """Get detected behavioral patterns for user"""
    
    user_profile = TradeVerseDB.get_user_profile(user_id)
    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    patterns = TradeVerseDB.get_behavioral_patterns(user_id)
    
    return {
        "patterns": patterns,
        "insights": _generate_behavioral_insights(patterns)
    }


# ============ PORTFOLIO EVALUATION ENDPOINTS ============

@router.post("/portfolio/evaluate/{user_id}")
def evaluate_portfolio_items(user_id: str):
    """
    Evaluate portfolio items against user's sandbox profile.
    Works even if user hasn't completed sandbox onboarding — uses a default profile.
    """
    try:
        user_profile = TradeVerseDB.get_user_profile(user_id)
        ai_profile   = TradeVerseDB.get_ai_profile(user_id)
        historical_trades = TradeVerseDB.get_user_trades(user_id) if user_profile else []

        # ── Fallback profile if not onboarded ──────────────────
        if not user_profile:
            from models.tradeverse import (
                FinancialGoal, InvestmentHorizon, RiskAppetite, StrategyType, InvestorLevel
            )
            user_profile = UserProfile(
                user_id=user_id, email="",
                financial_goal=FinancialGoal.WEALTH_GROWTH,
                investment_horizon=InvestmentHorizon.MEDIUM,
                risk_appetite=RiskAppetite.MEDIUM,
                monthly_budget=5000, experience_level="Beginner",
                created_at=datetime.now(), updated_at=datetime.now()
            )
        if not ai_profile:
            from models.tradeverse import StrategyType, InvestorLevel
            ai_profile = AIProfile(
                user_id=user_id, risk_score=50,
                strategy_type=StrategyType.BALANCED,
                level=InvestorLevel.BEGINNER,
                credit_score=1000,
                created_at=datetime.now(), updated_at=datetime.now()
            )

        # ── Fetch real portfolio items from portfolio.db with LIVE prices ──
        portfolio_items = []
        try:
            conn = sqlite3.connect("portfolio.db")
            cursor = conn.cursor()
            cursor.execute(
                "SELECT symbol, name, item_type FROM portfolio_items WHERE user_id = ?",
                (user_id,)
            )
            rows = cursor.fetchall()
            conn.close()
            for row in rows:
                symbol, name, item_type = row[0], row[1], row[2]
                live_price = _get_live_price(symbol)
                portfolio_items.append({
                    "symbol": symbol,
                    "name": name,
                    "asset_type": item_type,
                    "quantity": 1,
                    "buy_price": live_price,
                    "live_price": live_price,
                })
        except Exception:
            pass

        if not portfolio_items:
            return {
                "user_id": user_id,
                "portfolio_alignment_score": 0,
                "portfolio_rating": "No Data",
                "items": [],
                "recommendation": "Add stocks or mutual funds to your portfolio to get an evaluation.",
                "not_onboarded": TradeVerseDB.get_user_profile(user_id) is None,
                "timestamp": datetime.now().isoformat()
            }

        evaluations = []
        for item in portfolio_items:
            trade = TradeVerseTrade(
                trade_id=f"eval_{item['symbol']}",
                user_id=user_id,
                symbol=item["symbol"],
                asset_type=item["asset_type"],
                trade_type="buy",
                quantity=item["quantity"],
                buy_price=item["buy_price"],
                timestamp=datetime.now(),
                notes="Portfolio item evaluation"
            )

            points, feedback, analysis = TradeEvaluator.evaluate_trade(
                trade, user_profile, ai_profile, historical_trades
            )

            evaluations.append({
                "symbol":     item["symbol"],
                "name":       item.get("name", item["symbol"]),
                "asset_type": item["asset_type"],
                "live_price": item.get("live_price", item["buy_price"]),
                "feedback":   feedback.value,
                "label":      analysis.get("label", "Average"),
                "finalScore": analysis.get("finalScore", 0),
                "points":     points,
                "summary":    analysis.get("summary", ""),
                "mistakes":   analysis.get("mistakes", []),
                "improvements": analysis.get("improvements", []),
                "alignment": {
                    "goal_alignment":  analysis["goal_alignment"]["score"],
                    "risk_alignment":  analysis["risk_alignment"]["score"],
                    "diversification": analysis["diversification"]["score"],
                    "timing":          analysis["timing"]["score"],
                    "behavioral":      analysis["behavioral_check"]["score"],
                }
            })

        alignment_score = sum(
            e["alignment"]["goal_alignment"]  * 0.20 +
            e["alignment"]["risk_alignment"]  * 0.25 +
            e["alignment"]["diversification"] * 0.15 +
            e["alignment"]["timing"]          * 0.15 +
            e["alignment"]["behavioral"]      * 0.25
            for e in evaluations
        ) / len(evaluations)

        rating = (
            "Excellent" if alignment_score >= 70 else
            "Good"      if alignment_score >= 50 else
            "Fair"      if alignment_score >= 30 else "Poor"
        )

        return {
            "user_id": user_id,
            "portfolio_alignment_score": round(alignment_score, 2),
            "portfolio_rating": rating,
            "items": evaluations,
            "recommendation": _get_portfolio_recommendation(alignment_score, user_profile, ai_profile),
            "not_onboarded": False,
            "fetched_at": datetime.now().isoformat(),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/learning/strategy-info/{strategy_type}")
def get_strategy_info(strategy_type: str):
    """Get educational information about trading strategies"""
    
    from ..services.ai_profile_initializer import AIProfileInitializer
    from ..models.tradeverse import StrategyType
    
    try:
        strategy = StrategyType(strategy_type)
        info = AIProfileInitializer.get_strategy_recommendations(strategy)
        return {
            "strategy": strategy_type,
            "info": info
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid strategy type")


# ============ HELPER FUNCTIONS ============

def _generate_behavioral_insights(patterns: dict) -> List[str]:
    """Generate actionable insights from behavioral patterns"""
    
    insights = []
    
    if patterns.get("Panic Sell", {}).get("count", 0) > 2:
        insights.append("⚠️ You tend to panic sell on losses. Try setting stop losses beforehand.")
    
    if patterns.get("Overtrading", {}).get("count", 0) > 2:
        insights.append("📊 You're trading very frequently. More trades = more risk. Quality > Quantity.")
    
    if patterns.get("Satisfied Hold", {}).get("count", 0) > 3:
        insights.append("✅ Great! You're comfortable holding winning positions.")
    
    if not patterns:
        insights.append("📚 Start trading to build behavioral patterns for personalized insights.")
    
    return insights


def _get_portfolio_recommendation(alignment_score: float, user_profile: UserProfile, ai_profile: AIProfile) -> str:
    """Generate portfolio recommendation based on alignment score and profile"""
    
    if alignment_score >= 75:
        return "🎯 Perfect! Your portfolio is excellently aligned with your goals and risk profile. Consider maintaining this balance."
    elif alignment_score >= 60:
        return "✅ Good! Your portfolio matches your profile well. You might explore the Sandbox to fine-tune your trading strategy."
    elif alignment_score >= 45:
        return "⚠️ Fair alignment. Your portfolio has some mismatches with your risk profile. Use the Sandbox to practice better timing and diversification."
    elif alignment_score >= 30:
        return "❌ Weak alignment. Consider rebalancing your portfolio. Start with the Sandbox to learn optimal asset allocation for your goals."
    else:
        return "🚨 Poor alignment. Your portfolio has significant mismatches. Use the Sandbox to develop a better trading strategy tailored to your profile."


# ============ REAL-TIME MARKET ENDPOINTS ============

@router.get("/market/status")
def get_market_status():
    """Get real-time market status and timing info"""
    return RealTimeMarketService.get_current_market_status()


@router.get("/portfolio/live/{user_id}")
def get_portfolio_live(user_id: str):
    """
    Returns the user's portfolio items (from portfolio.db) with real-time prices.
    Used by the Sandbox dashboard to show what the user has added in Portfolio.
    """
    try:
        conn = sqlite3.connect("portfolio.db")
        cursor = conn.cursor()
        cursor.execute(
            "SELECT symbol, name, item_type, added_at FROM portfolio_items WHERE user_id = ?",
            (user_id,)
        )
        rows = cursor.fetchall()
        conn.close()
    except Exception:
        rows = []

    items = []
    for row in rows:
        symbol, name, item_type, added_at = row
        live_price = _get_live_price(symbol)
        items.append({
            "symbol":    symbol,
            "name":      name,
            "item_type": item_type,
            "added_at":  added_at,
            "live_price": live_price,
        })

    return {
        "items": items,
        "count": len(items),
        "fetched_at": datetime.now().isoformat(),
    }


@router.get("/market/volatility/{symbol}")
def get_market_volatility(symbol: str):
    """Get real-time volatility data for a symbol"""
    volatility = RealTimeMarketService.get_market_volatility(symbol)
    return volatility


@router.get("/market/optimal-entry")
def get_optimal_entry_window(risk_profile: str = "balanced"):
    """Get optimal trading window based on risk profile"""
    return RealTimeMarketService.calculate_optimal_entry_window("stock", risk_profile)


# ============ ENHANCED REAL-TIME LEADERBOARD ============

@router.get("/leaderboard/realtime/global")
def get_realtime_leaderboard(limit: int = 50):
    """
    Get real-time global leaderboard with live market data
    Updates every 3 seconds in frontend
    """
    try:
        entries = TradeVerseDB.get_leaderboard_global(limit)
        market_status = RealTimeMarketService.get_current_market_status()
        
        # Enhance entries with live data
        enhanced_entries = []
        for idx, entry in enumerate(entries, 1):
            enhanced_entry = entry.copy()
            enhanced_entry["rank"] = idx
            enhanced_entry["market_status"] = market_status["status"]
            enhanced_entry["last_update"] = datetime.now().isoformat()
            enhanced_entries.append(enhanced_entry)
        
        return {
            "entries": enhanced_entries,
            "market_status": market_status,
            "timestamp": datetime.now().isoformat(),
            "count": len(enhanced_entries)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/leaderboard/realtime/college/{college_name}")
def get_realtime_college_leaderboard(college_name: str, limit: int = 50):
    """Get real-time college leaderboard with live updates"""
    try:
        entries = TradeVerseDB.get_leaderboard_college(college_name, limit)
        market_status = RealTimeMarketService.get_current_market_status()
        
        enhanced_entries = []
        for idx, entry in enumerate(entries, 1):
            enhanced_entry = entry.copy()
            enhanced_entry["rank"] = idx
            enhanced_entry["college"] = college_name
            enhanced_entry["market_status"] = market_status["status"]
            enhanced_entry["last_update"] = datetime.now().isoformat()
            enhanced_entries.append(enhanced_entry)
        
        return {
            "entries": enhanced_entries,
            "college": college_name,
            "market_status": market_status,
            "timestamp": datetime.now().isoformat(),
            "count": len(enhanced_entries)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/leaderboard/realtime/user-stats/{user_id}")
def get_user_realtime_stats(user_id: str):
    """Get real-time user trading statistics"""
    try:
        user_profile = TradeVerseDB.get_user_profile(user_id)
        if not user_profile:
            raise HTTPException(status_code=404, detail="User not found")
        
        ai_profile = TradeVerseDB.get_ai_profile(user_id)
        trades = TradeVerseDB.get_user_trades(user_id)
        market_status = RealTimeMarketService.get_current_market_status()
        
        # Calculate real-time stats
        total_trades = len(trades)
        winning_trades = sum(1 for t in trades if t.evaluation and t.evaluation.get("points_awarded", 0) > 0)
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        
        total_points = sum(t.evaluation.get("points_awarded", 0) for t in trades if t.evaluation)
        
        # Category insights
        asset_distribution = {}
        for trade in trades:
            asset_type = trade.asset_type.value
            asset_distribution[asset_type] = asset_distribution.get(asset_type, 0) + 1
        
        return {
            "user_id": user_id,
            "ai_profile": {
                "level": ai_profile.level.value,
                "credit_score": ai_profile.credit_score,
                "risk_score": ai_profile.risk_score,
                "strategy_type": ai_profile.strategy_type.value,
            },
            "trading_stats": {
                "total_trades": total_trades,
                "winning_trades": winning_trades,
                "win_rate": round(win_rate, 2),
                "total_points": total_points,
                "avg_points_per_trade": round(total_points / total_trades, 2) if total_trades > 0 else 0,
            },
            "asset_distribution": asset_distribution,
            "market_status": market_status,
            "last_trade": trades[-1].timestamp.isoformat() if trades else None,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
