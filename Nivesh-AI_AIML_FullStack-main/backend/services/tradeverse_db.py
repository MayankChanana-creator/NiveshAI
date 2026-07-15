"""
TradeVerse Database Operations Layer
Handles all CRUD operations for sandbox feature
Uses SQLite for data persistence
"""

import sqlite3
from datetime import datetime
from typing import Optional, List
import json
from models.tradeverse import (
    UserProfile, AIProfile, TradeVerseTrade, CreditTransaction,
    LeaderboardEntry, FinancialGoal, InvestmentHorizon, RiskAppetite,
    InvestorLevel, StrategyType
)

DB_NAME = "tradeverse.db"


class TradeVerseDB:
    """Database operations for sandbox trading system"""

    @staticmethod
    def init_db():
        """Initialize all tables"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        # User Profiles Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                financial_goal TEXT NOT NULL,
                investment_horizon TEXT NOT NULL,
                risk_appetite TEXT NOT NULL,
                monthly_budget REAL NOT NULL,
                experience_level TEXT NOT NULL,
                education_level TEXT,
                age INTEGER,
                country TEXT,
                college_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # AI Profiles Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_profiles (
                user_id TEXT PRIMARY KEY,
                risk_score INTEGER NOT NULL,
                strategy_type TEXT NOT NULL,
                level TEXT DEFAULT 'Beginner',
                credit_score INTEGER DEFAULT 1000,
                consistency_score REAL DEFAULT 0.0,
                trades_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
            )
        """)

        # Sandbox Trades Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tradeverse_trades (
                trade_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                asset_type TEXT NOT NULL,
                trade_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                buy_price REAL NOT NULL,
                current_price REAL,
                pnl REAL,
                pnl_percent REAL,
                timestamp TIMESTAMP NOT NULL,
                notes TEXT,
                ai_feedback TEXT,
                trade_score INTEGER DEFAULT 0,
                evaluation_metrics TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
            )
        """)

        # Credit Transactions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS credit_transactions (
                transaction_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                trade_id TEXT,
                amount INTEGER NOT NULL,
                reason TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user_profiles(user_id),
                FOREIGN KEY (trade_id) REFERENCES tradeverse_trades(trade_id)
            )
        """)

        # Behavioral Patterns Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS behavioral_patterns (
                pattern_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                pattern_type TEXT NOT NULL,
                occurrence_count INTEGER DEFAULT 1,
                last_detected TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
            )
        """)

        # Leaderboard Cache Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leaderboard_cache (
                user_id TEXT PRIMARY KEY,
                rank INTEGER,
                credit_score INTEGER,
                consistency_score REAL,
                level TEXT,
                trades_count INTEGER,
                leaderboard_type TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
            )
        """)

        conn.commit()
        conn.close()

    # ============ USER PROFILE OPERATIONS ============

    @staticmethod
    def create_user_profile(profile: UserProfile) -> bool:
        """Create new user profile"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO user_profiles 
                (user_id, email, financial_goal, investment_horizon, risk_appetite,
                 monthly_budget, experience_level, education_level, age, country, college_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                profile.user_id, profile.email, profile.financial_goal.value,
                profile.investment_horizon.value, profile.risk_appetite.value,
                profile.monthly_budget, profile.experience_level,
                profile.education_level, profile.age, profile.country,
                profile.college_name
            ))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            conn.close()

    @staticmethod
    def get_user_profile(user_id: str) -> Optional[UserProfile]:
        """Get user profile by ID"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return UserProfile(
            user_id=row[0], email=row[1], financial_goal=FinancialGoal(row[2]),
            investment_horizon=InvestmentHorizon(row[3]), risk_appetite=RiskAppetite(row[4]),
            monthly_budget=row[5], experience_level=row[6], education_level=row[7],
            age=row[8], country=row[9], college_name=row[10],
            created_at=datetime.fromisoformat(row[11]),
            updated_at=datetime.fromisoformat(row[12])
        )

    # ============ AI PROFILE OPERATIONS ============

    @staticmethod
    def create_ai_profile(ai_profile: AIProfile) -> bool:
        """Create AI profile after user onboarding"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO ai_profiles 
                (user_id, risk_score, strategy_type, level, credit_score)
                VALUES (?, ?, ?, ?, ?)
            """, (
                ai_profile.user_id, ai_profile.risk_score,
                ai_profile.strategy_type.value, ai_profile.level.value,
                ai_profile.credit_score
            ))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            conn.close()

    @staticmethod
    def get_ai_profile(user_id: str) -> Optional[AIProfile]:
        """Get AI profile"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM ai_profiles WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return AIProfile(
            user_id=row[0], risk_score=row[1], strategy_type=StrategyType(row[2]),
            level=InvestorLevel(row[3]), credit_score=row[4],
            consistency_score=row[5], trades_count=row[6],
            created_at=datetime.fromisoformat(row[7]),
            updated_at=datetime.fromisoformat(row[8])
        )

    # ============ TRADE OPERATIONS ============

    @staticmethod
    def add_trade(trade: TradeVerseTrade) -> bool:
        """Add new trade"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO tradeverse_trades
                (trade_id, user_id, symbol, asset_type, trade_type, quantity,
                 buy_price, current_price, pnl, pnl_percent, timestamp, notes,
                 ai_feedback, trade_score, evaluation_metrics)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                trade.trade_id, trade.user_id, trade.symbol, trade.asset_type.value,
                trade.trade_type.value, trade.quantity, trade.buy_price,
                trade.current_price, trade.pnl, trade.pnl_percent, trade.timestamp,
                trade.notes, trade.ai_feedback, trade.trade_score,
                json.dumps(trade.evaluation_metrics) if trade.evaluation_metrics else None
            ))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            conn.close()

    @staticmethod
    def get_user_trades(user_id: str, limit: int = 50) -> List[TradeVerseTrade]:
        """Get all trades for a user"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT trade_id, user_id, symbol, asset_type, trade_type, quantity,
                   buy_price, current_price, pnl, pnl_percent, timestamp, notes,
                   ai_feedback, trade_score, evaluation_metrics
            FROM tradeverse_trades
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (user_id, limit))

        rows = cursor.fetchall()
        conn.close()

        trades = []
        for row in rows:
            trades.append(TradeVerseTrade(
                trade_id=row[0], user_id=row[1], symbol=row[2],
                asset_type=row[3], trade_type=row[4], quantity=row[5],
                buy_price=row[6], current_price=row[7], pnl=row[8],
                pnl_percent=row[9], timestamp=datetime.fromisoformat(row[10]),
                notes=row[11], ai_feedback=row[12], trade_score=row[13],
                evaluation_metrics=json.loads(row[14]) if row[14] else None
            ))

        return trades

    # ============ CREDIT OPERATIONS ============

    @staticmethod
    def add_credit_transaction(transaction: CreditTransaction) -> bool:
        """Record credit transaction"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO credit_transactions
                (transaction_id, user_id, trade_id, amount, reason, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                transaction.transaction_id, transaction.user_id,
                transaction.trade_id, transaction.amount, transaction.reason,
                transaction.timestamp
            ))

            # Update AI profile credit score
            cursor.execute("""
                UPDATE ai_profiles
                SET credit_score = credit_score + ?, updated_at = ?
                WHERE user_id = ?
            """, (transaction.amount, datetime.now().isoformat(), transaction.user_id))

            conn.commit()
            return True
        except Exception:
            return False
        finally:
            conn.close()

    @staticmethod
    def update_ai_profile_level(user_id: str):
        """Update investor level based on credit score"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        cursor.execute("SELECT credit_score FROM ai_profiles WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return

        score = row[0]
        if score < 1200:
            new_level = "Beginner"
        elif score < 1600:
            new_level = "Intermediate"
        elif score < 2200:
            new_level = "Advanced"
        else:
            new_level = "Pro"

        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE ai_profiles
            SET level = ?, updated_at = ?
            WHERE user_id = ?
        """, (new_level, datetime.now().isoformat(), user_id))
        conn.commit()
        conn.close()

    # ============ LEADERBOARD OPERATIONS ============

    @staticmethod
    def get_global_leaderboard(limit: int = 100) -> List[LeaderboardEntry]:
        """Get global leaderboard"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT up.user_id, up.email, ap.credit_score, ap.consistency_score,
                   ap.level, ap.trades_count
            FROM ai_profiles ap
            JOIN user_profiles up ON ap.user_id = up.user_id
            ORDER BY ap.credit_score DESC, ap.consistency_score DESC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        conn.close()

        entries = []
        for rank, row in enumerate(rows, 1):
            entries.append(LeaderboardEntry(
                user_id=row[0], email=row[1], rank=rank,
                credit_score=row[2], consistency_score=row[3],
                level=InvestorLevel(row[4]), trades_count=row[5],
                updated_at=datetime.now()
            ))

        return entries

    @staticmethod
    def get_college_leaderboard(college_name: str, limit: int = 100) -> List[LeaderboardEntry]:
        """Get college-specific leaderboard"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT up.user_id, up.email, ap.credit_score, ap.consistency_score,
                   ap.level, ap.trades_count, up.college_name
            FROM ai_profiles ap
            JOIN user_profiles up ON ap.user_id = up.user_id
            WHERE up.college_name = ?
            ORDER BY ap.credit_score DESC, ap.consistency_score DESC
            LIMIT ?
        """, (college_name, limit))

        rows = cursor.fetchall()
        conn.close()

        entries = []
        for rank, row in enumerate(rows, 1):
            entries.append(LeaderboardEntry(
                user_id=row[0], email=row[1], rank=rank,
                credit_score=row[2], consistency_score=row[3],
                level=InvestorLevel(row[4]), trades_count=row[5],
                college_name=row[6], updated_at=datetime.now()
            ))

        return entries

    # ============ BEHAVIORAL PATTERN OPERATIONS ============

    @staticmethod
    def record_behavioral_pattern(user_id: str, pattern_type: str):
        """Record detected behavioral pattern"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT pattern_id FROM behavioral_patterns
            WHERE user_id = ? AND pattern_type = ?
        """, (user_id, pattern_type))

        existing = cursor.fetchone()

        if existing:
            cursor.execute("""
                UPDATE behavioral_patterns
                SET occurrence_count = occurrence_count + 1,
                    last_detected = ?,
                    updated_at = ?
                WHERE user_id = ? AND pattern_type = ?
            """, (datetime.now().isoformat(), datetime.now().isoformat(), user_id, pattern_type))
        else:
            pattern_id = f"{user_id}_{pattern_type}_{int(datetime.now().timestamp())}"
            cursor.execute("""
                INSERT INTO behavioral_patterns
                (pattern_id, user_id, pattern_type, last_detected)
                VALUES (?, ?, ?, ?)
            """, (pattern_id, user_id, pattern_type, datetime.now().isoformat()))

        conn.commit()
        conn.close()

    @staticmethod
    def get_behavioral_patterns(user_id: str) -> dict:
        """Get user's behavioral patterns"""
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT pattern_type, occurrence_count, last_detected
            FROM behavioral_patterns
            WHERE user_id = ?
            ORDER BY occurrence_count DESC
        """, (user_id,))

        rows = cursor.fetchall()
        conn.close()

        patterns = {}
        for row in rows:
            patterns[row[0]] = {"count": row[1], "last_detected": row[2]}

        return patterns


# Initialize database on import
TradeVerseDB.init_db()
