"""
TradeVerse Trading System Models
Includes: User Profiles, AI Profiles, Trades, Credit System, Leaderboards
"""

from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime


# ============ ENUMS ============

class FinancialGoal(str, Enum):
    WEALTH_GROWTH = "wealth_growth"
    SHORT_TERM_PROFIT = "short_term_profit"
    PASSIVE_INCOME = "passive_income"


class InvestmentHorizon(str, Enum):
    SHORT = "short"  # < 1 year
    MEDIUM = "medium"  # 1-5 years
    LONG = "long"  # > 5 years


class RiskAppetite(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class StrategyType(str, Enum):
    CONSERVATIVE = "conservative"
    BALANCED = "balanced"
    AGGRESSIVE = "aggressive"
    SWING = "swing"
    DAY_TRADING = "day_trading"


class InvestorLevel(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    PRO = "Pro"


class TradeType(str, Enum):
    BUY = "buy"
    SELL = "sell"


class AssetType(str, Enum):
    STOCK = "stock"
    MUTUAL_FUND = "mutual_fund"
    CRYPTO = "crypto"


class BehavioralPattern(str, Enum):
    PANIC_SELL = "Panic Sell"
    NERVOUS_HOLD = "Nervous Hold"
    SATISFIED_HOLD = "Satisfied Hold"
    GREEDY = "Greedy/Overconfident"
    NEUTRAL = "Neutral"
    OVERTRADING = "Overtrading"
    RANDOM = "Random"


class TradeFeedback(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    NEUTRAL = "neutral"
    WARNING = "warning"
    POOR = "poor"


# ============ INPUT MODELS ============

class InvestorProfileInput(BaseModel):
    """User onboarding form data"""
    financial_goal: FinancialGoal
    investment_horizon: InvestmentHorizon
    risk_appetite: RiskAppetite
    monthly_budget: float
    experience_level: str  # Self-declared: Beginner, Intermediate, Expert
    education_level: Optional[str] = None
    age: Optional[int] = None
    country: Optional[str] = None
    college_name: Optional[str] = None  # For college leaderboard


class AddTradeInput(BaseModel):
    """Add trade to sandbox portfolio"""
    symbol: str
    asset_type: AssetType
    trade_type: TradeType
    quantity: float
    buy_price: float
    timestamp: Optional[datetime] = None
    notes: Optional[str] = None


# ============ DATABASE MODELS ============

class UserProfile(BaseModel):
    """Core user profile - stores onboarding data"""
    user_id: str
    email: str
    financial_goal: FinancialGoal
    investment_horizon: InvestmentHorizon
    risk_appetite: RiskAppetite
    monthly_budget: float
    experience_level: str
    education_level: Optional[str] = None
    age: Optional[int] = None
    country: Optional[str] = None
    college_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "auth0|123",
                "email": "user@example.com",
                "financial_goal": "wealth_growth",
                "investment_horizon": "long",
                "risk_appetite": "medium",
                "monthly_budget": 5000,
                "experience_level": "Intermediate",
                "college_name": "IIT Delhi",
            }
        }


class AIProfile(BaseModel):
    """AI-generated profile based on user input"""
    user_id: str
    risk_score: int  # 0-100
    strategy_type: StrategyType
    level: InvestorLevel
    credit_score: int
    consistency_score: float = 0.0
    trades_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "auth0|123",
                "risk_score": 55,
                "strategy_type": "balanced",
                "level": "Beginner",
                "credit_score": 1000,
                "consistency_score": 0.7,
                "trades_count": 5,
            }
        }


class TradeVerseTrade(BaseModel):
    """Virtual trade record"""
    trade_id: str
    user_id: str
    symbol: str
    asset_type: AssetType
    trade_type: TradeType
    quantity: float
    buy_price: float
    current_price: Optional[float] = None
    pnl: Optional[float] = None  # Profit/Loss
    pnl_percent: Optional[float] = None
    timestamp: datetime
    notes: Optional[str] = None
    ai_feedback: Optional[str] = None
    trade_score: int = 0  # Points awarded/deducted
    evaluation_metrics: Optional[dict] = None  # Detailed evaluation

    class Config:
        json_schema_extra = {
            "example": {
                "trade_id": "trade_123",
                "user_id": "auth0|123",
                "symbol": "AAPL",
                "asset_type": "stock",
                "trade_type": "buy",
                "quantity": 10,
                "buy_price": 150.0,
                "current_price": 155.0,
                "pnl": 50.0,
                "pnl_percent": 3.33,
                "timestamp": "2024-01-15T10:30:00Z",
                "trade_score": 25,
            }
        }


class CreditTransaction(BaseModel):
    """Record of credit score changes"""
    transaction_id: str
    user_id: str
    trade_id: Optional[str] = None
    amount: int  # Points added/subtracted
    reason: str  # e.g., "Good trade alignment", "Risk too high"
    timestamp: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": "txn_123",
                "user_id": "auth0|123",
                "trade_id": "trade_123",
                "amount": 25,
                "reason": "Good trade alignment with long-term goals",
                "timestamp": "2024-01-15T10:30:00Z",
            }
        }


class LeaderboardEntry(BaseModel):
    """Leaderboard ranking"""
    user_id: str
    email: str
    username: Optional[str] = None
    rank: int
    credit_score: int
    consistency_score: float
    level: InvestorLevel
    trades_count: int
    college_name: Optional[str] = None
    updated_at: datetime


# ============ RESPONSE MODELS ============

class TradeEvaluation(BaseModel):
    """AI evaluation result for a trade"""
    trade_id: str
    feedback: TradeFeedback
    summary: str
    points_awarded: int
    detailed_analysis: dict
    suggestions: List[str]
    metrics: dict


class AIProfileResponse(BaseModel):
    """API response for AI profile"""
    user_id: str
    risk_score: int
    strategy_type: str
    level: str
    credit_score: int
    consistency_score: float
    trades_count: int
    next_level_threshold: int
    points_to_next_level: int


class UserTradeVerseDashboard(BaseModel):
    """Complete user sandbox data"""
    user_profile: UserProfile
    ai_profile: AIProfileResponse
    trades: List[TradeVerseTrade]
    portfolio_value: float
    total_pnl: float
    recent_feedback: List[dict]
    behavioral_pattern: Optional[str] = None


class LeaderboardResponse(BaseModel):
    """Leaderboard data"""
    leaderboard_type: str  # "global", "college", "friends"
    entries: List[LeaderboardEntry]
    user_rank: int
    user_score: int
