import sqlite3
import os

DB_NAME = "wealthpilot.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # User Profile table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS wealth_pilot_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            age INTEGER DEFAULT 25,
            risk_profile TEXT DEFAULT 'moderate',
            savings_goal REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Income sources
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS wealth_pilot_incomes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            frequency TEXT DEFAULT 'monthly',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Expenses
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS wealth_pilot_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT,
            is_fixed BOOLEAN DEFAULT 1,
            source TEXT DEFAULT 'manual',
            merchant TEXT,
            expense_date TEXT,
            receipt_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

# Initialize tables when imported
init_db()

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn
