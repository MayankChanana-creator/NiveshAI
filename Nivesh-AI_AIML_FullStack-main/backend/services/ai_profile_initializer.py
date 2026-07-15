"""
AI Profile Initialization Service
Converts user onboarding data into AI trading profile
Calculates risk scores and recommended strategies
"""

from typing import Tuple
from datetime import datetime
from models.tradeverse import (
    UserProfile, AIProfile, InvestorProfileInput,
    StrategyType, InvestorLevel
)


class AIProfileInitializer:
    """Initialize AI profile from user data"""

    @staticmethod
    def create_ai_profile_from_user(
        user_id: str,
        profile_input: InvestorProfileInput
    ) -> AIProfile:
        """
        Create AI profile from user onboarding input
        
        Process:
        1. Calculate risk score (0-100) from profile data
        2. Recommend strategy type
        3. Set initial level to Beginner
        4. Initialize credit score to 1000
        """

        risk_score = AIProfileInitializer._calculate_risk_score(profile_input)
        strategy_type = AIProfileInitializer._recommend_strategy(risk_score, profile_input)

        ai_profile = AIProfile(
            user_id=user_id,
            risk_score=risk_score,
            strategy_type=strategy_type,
            level=InvestorLevel.BEGINNER,
            credit_score=1000,  # Starting points
            consistency_score=0.0,
            trades_count=0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        return ai_profile

    @staticmethod
    def _calculate_risk_score(profile: InvestorProfileInput) -> int:
        """
        Calculate overall risk score (0-100)
        
        Factors:
        - Risk appetite (primary): 0-100 scale
        - Investment horizon: longer = more risk tolerance
        - Experience level: more experience = handled risk
        - Age: younger = more time to recover
        - Monthly budget: indicates capital stability
        """

        score = 50  # Baseline

        # 1. Risk Appetite (40% weight)
        risk_appetite_map = {
            "low": 20,
            "medium": 50,
            "high": 80
        }
        appetite_score = risk_appetite_map.get(profile.risk_appetite.value, 50)
        score = (score * 0.6) + (appetite_score * 0.4)

        # 2. Investment Horizon (20% weight)
        horizon_map = {
            "short": 30,   # Less time = lower risk tolerance
            "medium": 55,
            "long": 75     # More time = can tolerate more risk
        }
        horizon_score = horizon_map.get(profile.investment_horizon.value, 50)
        score = (score * 0.8) + (horizon_score * 0.2)

        # 3. Experience Level (25% weight)
        experience_map = {
            "beginner": 25,
            "intermediate": 55,
            "expert": 80,
            "novice": 20,
            "advanced": 75
        }
        exp_score = experience_map.get(profile.experience_level.lower(), 50)
        score = (score * 0.75) + (exp_score * 0.25)

        # 4. Age adjustment (15% weight) - if provided
        if profile.age:
            if profile.age < 25:
                age_score = 70  # Young: can take more risk
            elif profile.age < 35:
                age_score = 60
            elif profile.age < 50:
                age_score = 45
            elif profile.age < 60:
                age_score = 35
            else:
                age_score = 25
            score = (score * 0.85) + (age_score * 0.15)

        # 5. Monthly Budget Assessment (10% weight)
        if profile.monthly_budget:
            if profile.monthly_budget < 1000:
                budget_score = 35  # Limited capital = be conservative
            elif profile.monthly_budget < 5000:
                budget_score = 50
            elif profile.monthly_budget < 10000:
                budget_score = 65
            else:
                budget_score = 75  # More capital = can sustain volatility
            score = (score * 0.9) + (budget_score * 0.1)

        return int(max(0, min(100, score)))

    @staticmethod
    def _recommend_strategy(risk_score: int, profile: InvestorProfileInput) -> StrategyType:
        """
        Recommend trading strategy based on profile
        """

        # Primary recommendation based on risk score
        if risk_score < 30:
            base_strategy = StrategyType.CONSERVATIVE
        elif risk_score < 50:
            base_strategy = StrategyType.BALANCED
        elif risk_score < 70:
            # For high risk but early stage: recommend aggressive with guidance
            base_strategy = StrategyType.AGGRESSIVE
        else:
            # Very high risk score: could handle day trading/swing
            if profile.experience_level.lower() in ["expert", "advanced"]:
                base_strategy = StrategyType.SWING
            else:
                base_strategy = StrategyType.AGGRESSIVE

        # Adjust based on investment horizon
        if profile.investment_horizon.value == "short":
            if risk_score >= 60:
                base_strategy = StrategyType.DAY_TRADING
            elif risk_score >= 40:
                base_strategy = StrategyType.SWING

        return base_strategy

    @staticmethod
    def get_strategy_recommendations(strategy: StrategyType) -> dict:
        """Get education and guidance for recommended strategy"""

        recommendations = {
            StrategyType.CONSERVATIVE: {
                "description": "Capital preservation with steady growth",
                "target_assets": ["Blue-chip stocks", "Bond mutual funds", "Government securities"],
                "targets": {
                    "expected_annual_return": "8-12%",
                    "volatility": "Low",
                    "holding_period": "3+ years"
                },
                "tips": [
                    "Focus on dividend-yielding stocks",
                    "Invest in index funds for diversification",
                    "Avoid leveraged products",
                    "Dollar-cost averaging is your friend",
                ]
            },
            StrategyType.BALANCED: {
                "description": "Mix of stability and growth",
                "target_assets": ["Quality stocks", "Mixed mutual funds", "Some crypto"],
                "targets": {
                    "expected_annual_return": "12-18%",
                    "volatility": "Medium",
                    "holding_period": "1-3 years"
                },
                "tips": [
                    "70% stable + 30% growth assets",
                    "Rebalance quarterly",
                    "Don't panic sell on dips",
                ]
            },
            StrategyType.AGGRESSIVE: {
                "description": "Growth-focused with higher volatility",
                "target_assets": ["Growth stocks", "Small-caps", "Crypto", "Options"],
                "targets": {
                    "expected_annual_return": "20-40%",
                    "volatility": "High",
                    "holding_period": "6-12 months"
                },
                "tips": [
                    "Accept 20-30% drawdowns",
                    "Use technical analysis",
                    "Diversify across sectors",
                ]
            },
            StrategyType.SWING: {
                "description": "Medium-term trend following",
                "target_assets": ["Volatile stocks", "Crypto", "Commodities"],
                "targets": {
                    "expected_annual_return": "40-60%",
                    "volatility": "Very High",
                    "holding_period": "3 days - 2 weeks"
                },
                "tips": [
                    "Learn chart patterns",
                    "Use stop losses religiously",
                    "Risk only 1-2% per trade",
                ]
            },
            StrategyType.DAY_TRADING: {
                "description": "Short-term momentum trading",
                "target_assets": ["Liquid stocks", "Crypto", "Index futures"],
                "targets": {
                    "expected_annual_return": "60%+",
                    "volatility": "Extreme",
                    "holding_period": "Minutes to hours"
                },
                "tips": [
                    "Master risk management first",
                    "Use leverage conservatively",
                    "Keep emotional discipline",
                    "Track taxes carefully",
                ]
            }
        }

        return recommendations.get(strategy, {})

    @staticmethod
    def get_onboarding_prompts() -> dict:
        """Get structured prompts for user onboarding form"""

        return {
            "financial_goal": {
                "question": "What is your primary financial goal?",
                "options": [
                    {"value": "wealth_growth", "label": "Long-term wealth accumulation"},
                    {"value": "short_term_profit", "label": "Short-term profit taking"},
                    {"value": "passive_income", "label": "Passive income generation"},
                ],
                "description": "This helps tailor your investment strategy"
            },
            "investment_horizon": {
                "question": "What is your investment time horizon?",
                "options": [
                    {"value": "short", "label": "Short-term (< 1 year)"},
                    {"value": "medium", "label": "Medium-term (1-5 years)"},
                    {"value": "long", "label": "Long-term (> 5 years)"},
                ],
                "description": "Longer horizons allow for more volatility exposure"
            },
            "risk_appetite": {
                "question": "What is your risk tolerance?",
                "options": [
                    {"value": "low", "label": "Low - Protect capital"},
                    {"value": "medium", "label": "Medium - Balance risk/reward"},
                    {"value": "high", "label": "High - Maximize growth"},
                ],
                "description": "Higher risk can lead to higher returns, but with bigger losses"
            },
            "monthly_budget": {
                "question": "What is your typical monthly investment budget?",
                "type": "number",
                "description": "This helps us gauge your investment capacity",
                "placeholder": "e.g., 5000"
            },
            "experience_level": {
                "question": "What is your investment experience?",
                "options": [
                    {"value": "beginner", "label": "Beginner - Just starting out"},
                    {"value": "intermediate", "label": "Intermediate - Some experience"},
                    {"value": "expert", "label": "Expert - Veteran trader"},
                ],
                "description": "Helps us recommend appropriate strategies"
            },
            "education_level": {
                "question": "Educational background (optional)",
                "type": "text",
                "placeholder": "e.g., Bachelor's in Finance"
            },
            "age": {
                "question": "Age (optional)",
                "type": "number",
                "placeholder": "e.g., 25"
            },
            "college_name": {
                "question": "College/University (optional - for leaderboard)",
                "type": "text",
                "placeholder": "e.g., IIT Delhi"
            }
        }

    @staticmethod
    def get_level_thresholds() -> dict:
        """Get level progression thresholds"""

        return {
            "Beginner": {
                "min_credit": 0,
                "max_credit": 1199,
                "description": "Learning the fundamentals",
                "perks": ["Educational content", "Basic portfolio tracking"]
            },
            "Intermediate": {
                "min_credit": 1200,
                "max_credit": 1999,
                "description": "Demonstrated consistent good trading",
                "perks": ["Advanced analytics", "Strategy recommendations", "Peer insights"]
            },
            "Pro": {
                "min_credit": 2000,
                "max_credit": 9999,
                "description": "Master trader with proven discipline",
                "perks": ["Pro tools", "API access", "Mentorship opportunities", "Exclusive content"]
            }
        }
