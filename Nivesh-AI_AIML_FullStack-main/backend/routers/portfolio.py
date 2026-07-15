import sqlite3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])

# -----------------------------
# DATABASE INITIALIZATION
# -----------------------------
DB_NAME = "portfolio.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS portfolio_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            symbol TEXT NOT NULL,
            name TEXT NOT NULL,
            item_type TEXT NOT NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, symbol)
        )
    """)
    conn.commit()
    conn.close()

# Create DB & table on import
init_db()

# -----------------------------
# MODELS
# -----------------------------
class PortfolioItem(BaseModel):
    symbol: str
    name: str
    item_type: str = "stock"  # stock | mutual_fund | crypto

class PortfolioItemResponse(BaseModel):
    id: int
    symbol: str
    name: str
    item_type: str
    added_at: str

# -----------------------------
# ROUTES
# -----------------------------

@router.post("/add/{user_id}", response_model=PortfolioItemResponse)
def add_to_portfolio(user_id: str, item: PortfolioItem):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO portfolio_items (user_id, symbol, name, item_type)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, item.symbol, item.name, item.item_type)
        )
        conn.commit()

        cursor.execute(
            "SELECT id, symbol, name, item_type, added_at FROM portfolio_items WHERE id = ?",
            (cursor.lastrowid,)
        )
        row = cursor.fetchone()

        return PortfolioItemResponse(
            id=row[0],
            symbol=row[1],
            name=row[2],
            item_type=row[3],
            added_at=row[4]
        )

    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Item already in portfolio")

    finally:
        conn.close()


@router.get("/{user_id}", response_model=List[PortfolioItemResponse])
def get_portfolio(user_id: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, symbol, name, item_type, added_at FROM portfolio_items WHERE user_id = ?",
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()

    return [
        PortfolioItemResponse(
            id=row[0],
            symbol=row[1],
            name=row[2],
            item_type=row[3],
            added_at=row[4]
        )
        for row in rows
    ]


@router.delete("/{user_id}/{item_id}")
def remove_from_portfolio(user_id: str, item_id: int):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM portfolio_items WHERE id = ? AND user_id = ?",
        (item_id, user_id)
    )

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")

    conn.commit()
    conn.close()
    return {"message": "Item removed successfully"}
