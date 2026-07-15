from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
import os
import json
import io
import pytesseract
from PIL import Image
from dotenv import load_dotenv

from models.wealthpilot_db import get_db_connection

load_dotenv()

router = APIRouter(prefix="/api/wealth-pilot", tags=["WealthPilot"])

client = OpenAI(
    api_key=os.environ.get("ASI_API_KEY"),
    base_url="https://inference.asicloud.cudos.org/v1",
)

# ---------------------------------------------
# Input Models for Analysis
# ---------------------------------------------
class IncomeSource(BaseModel):
    name: str
    amount: float
    frequency: str = "monthly"  # monthly | yearly | weekly

class Expense(BaseModel):
    name: str
    amount: float
    category: str = ""  # will be auto-categorized if empty
    is_fixed: bool = True

class WealthPilotRequest(BaseModel):
    income_sources: List[IncomeSource]
    expenses: List[Expense]
    risk_profile: str = "moderate"  # conservative | moderate | aggressive
    age: int = 25
    savings_goal: float = 0  # optional target savings
    portfolio: list = []  # existing portfolio items

# ---------------------------------------------
# Input Models for Persistence
# ---------------------------------------------
class UserProfileSave(BaseModel):
    age: int
    risk_profile: str
    savings_goal: float

class IncomeSave(BaseModel):
    id: Optional[int] = None
    name: str
    amount: float
    frequency: str

class ExpenseSave(BaseModel):
    id: Optional[int] = None
    name: str
    amount: float
    category: str = ""
    is_fixed: bool
    source: str = "manual"
    merchant: Optional[str] = None
    expense_date: Optional[str] = None

class WealthPilotSaveRequest(BaseModel):
    profile: UserProfileSave
    incomes: List[IncomeSave]
    expenses: List[ExpenseSave]

# ---------------------------------------------
# Persistence Endpoints
# ---------------------------------------------
@router.get("/data/{user_id}")
async def get_user_data(user_id: str):
    conn = get_db_connection()
    
    # Profile
    profile_row = conn.execute("SELECT age, risk_profile, savings_goal FROM wealth_pilot_profiles WHERE user_id = ?", (user_id,)).fetchone()
    profile = {
        "age": profile_row["age"] if profile_row else 25,
        "risk_profile": profile_row["risk_profile"] if profile_row else "moderate",
        "savings_goal": profile_row["savings_goal"] if profile_row else 0
    }
    
    # Incomes
    incomes_rows = conn.execute("SELECT id, name, amount, frequency FROM wealth_pilot_incomes WHERE user_id = ?", (user_id,)).fetchall()
    incomes = [dict(r) for r in incomes_rows]
    
    # Expenses
    expenses_rows = conn.execute("SELECT id, name, amount, category, is_fixed, source, merchant, expense_date, receipt_text FROM wealth_pilot_expenses WHERE user_id = ?", (user_id,)).fetchall()
    expenses = [
        {
            **dict(r),
            "is_fixed": bool(r["is_fixed"])
        } for r in expenses_rows
    ]
    
    conn.close()
    return {"profile": profile, "incomes": incomes, "expenses": expenses}

@router.post("/save/{user_id}")
async def save_user_data(user_id: str, req: WealthPilotSaveRequest):
    conn = get_db_connection()
    c = conn.cursor()
    
    # Profile
    c.execute("""
        INSERT INTO wealth_pilot_profiles (user_id, age, risk_profile, savings_goal)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            age=excluded.age,
            risk_profile=excluded.risk_profile,
            savings_goal=excluded.savings_goal,
            updated_at=CURRENT_TIMESTAMP
    """, (user_id, req.profile.age, req.profile.risk_profile, req.profile.savings_goal))
    
    # Save Incomes
    incoming_income_ids = [i.id for i in req.incomes if i.id]
    if incoming_income_ids:
        placeholders = ",".join("?" * len(incoming_income_ids))
        c.execute(f"DELETE FROM wealth_pilot_incomes WHERE user_id=? AND id NOT IN ({placeholders})", [user_id] + incoming_income_ids)
    else:
        c.execute("DELETE FROM wealth_pilot_incomes WHERE user_id=?", (user_id,))
    
    for inc in req.incomes:
        if inc.id:
            c.execute("UPDATE wealth_pilot_incomes SET name=?, amount=?, frequency=? WHERE id=? AND user_id=?",
                      (inc.name, inc.amount, inc.frequency, inc.id, user_id))
        else:
            c.execute("INSERT INTO wealth_pilot_incomes (user_id, name, amount, frequency) VALUES (?, ?, ?, ?)",
                      (user_id, inc.name, inc.amount, inc.frequency))
    
    # Save Expenses
    incoming_expense_ids = [e.id for e in req.expenses if e.id]
    if incoming_expense_ids:
        placeholders = ",".join("?" * len(incoming_expense_ids))
        c.execute(f"DELETE FROM wealth_pilot_expenses WHERE user_id=? AND id NOT IN ({placeholders})", [user_id] + incoming_expense_ids)
    else:
        c.execute("DELETE FROM wealth_pilot_expenses WHERE user_id=?", (user_id,))
        
    for exp in req.expenses:
        if exp.id:
            c.execute("UPDATE wealth_pilot_expenses SET name=?, amount=?, category=?, is_fixed=?, source=?, merchant=?, expense_date=? WHERE id=? AND user_id=?",
                      (exp.name, exp.amount, exp.category, int(exp.is_fixed), exp.source, exp.merchant, exp.expense_date, exp.id, user_id))
        else:
            c.execute("INSERT INTO wealth_pilot_expenses (user_id, name, amount, category, is_fixed, source, merchant, expense_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                      (user_id, exp.name, exp.amount, exp.category, int(exp.is_fixed), exp.source, exp.merchant, exp.expense_date))
            
    conn.commit()
    conn.close()
    return {"message": "Saved successfully"}

@router.delete("/expense/{user_id}/{expense_id}")
async def delete_expense(user_id: str, expense_id: int):
    conn = get_db_connection()
    conn.execute("DELETE FROM wealth_pilot_expenses WHERE id=? AND user_id=?", (expense_id, user_id))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

@router.delete("/income/{user_id}/{income_id}")
async def delete_income(user_id: str, income_id: int):
    conn = get_db_connection()
    conn.execute("DELETE FROM wealth_pilot_incomes WHERE id=? AND user_id=?", (income_id, user_id))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

# ---------------------------------------------
# OCR Upload Endpoint
# ---------------------------------------------
@router.post("/ocr-scan")
async def ocr_scan_receipt(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Extract text via Tesseract
        raw_text = pytesseract.image_to_string(image)
        
        # Ask AI to parse
        prompt = f"""
        Extract the following information from this raw receipt/bill OCR text.
        Return ONLY valid JSON with no markdown.
        Schema:
        {{
            "merchant": "Name of store/vendor, or unknown",
            "date": "YYYY-MM-DD or unknown",
            "amount": numeric (highest total found, e.g. 54.30),
            "category": "Suggested category (e.g. Food & Dining, Utilities, Transportation, etc)"
        }}
        
        Raw OCR Text:
        {raw_text}
        """
        
        response = client.chat.completions.create(
            model="asi1-mini",
            messages=[{"role": "user", "content": prompt}],
            stream=False,
        )
        
        raw = response.choices[0].message.content.strip()
        raw = raw.replace('```json', '').replace('```', '').strip()
        result = json.loads(raw)
        
        result["raw_text"] = raw_text
        return result
        
    except json.JSONDecodeError as e:
        print(f"OCR JSON Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse OCR results (JSON error)")
    except Exception as e:
        print(f"OCR Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------
# Analysis Endpoint
# ---------------------------------------------
@router.post("/analyze")
async def analyze_finances(req: WealthPilotRequest):
    """
    Combined AI analysis: expense categorization, budget plan, and investment allocation.
    """
    total_income = sum(
        s.amount * (12 if s.frequency == "yearly" else 1) * (1 if s.frequency == "monthly" else 4 if s.frequency == "weekly" else 1)
        for s in req.income_sources
    )
    total_expenses = sum(e.amount for e in req.expenses)
    fixed_expenses = sum(e.amount for e in req.expenses if e.is_fixed)
    variable_expenses = total_expenses - fixed_expenses
    surplus = total_income - total_expenses

    # Build expense list for AI
    expense_list = "\n".join([
        f"- {e.name}: Rs.{e.amount}/month {'(fixed)' if e.is_fixed else '(variable)'} {f'[{e.category}]' if e.category else ''}"
        for e in req.expenses
    ])

    portfolio_desc = ""
    if req.portfolio:
        items = ", ".join([f"{p.get('name', p.get('symbol', '?'))} ({p.get('item_type', 'stock')})" for p in req.portfolio[:15]])
        portfolio_desc = f"\nExisting portfolio: {items}"

    prompt = f"""
You are WealthPilot, an expert AI financial advisor for Indian users. Analyze the following financial data and provide a comprehensive plan.

FINANCIAL DATA:
- Total Monthly Income: Rs.{total_income:,.0f}
- Total Monthly Expenses: Rs.{total_expenses:,.0f}
  - Fixed: Rs.{fixed_expenses:,.0f}
  - Variable: Rs.{variable_expenses:,.0f}
- Monthly Surplus: Rs.{surplus:,.0f}
- Risk Profile: {req.risk_profile}
- Age: {req.age}
- Savings Goal: Rs.{req.savings_goal:,.0f} (0 = no specific goal)
{portfolio_desc}

EXPENSE BREAKDOWN:
{expense_list}

Provide your analysis as VALID JSON with this exact structure:
{{
    "expense_analysis": {{
        "categories": [
            {{"name": "Housing", "amount": 0, "percentage": 0, "items": ["Rent"]}},
            {{"name": "Food & Dining", "amount": 0, "percentage": 0, "items": ["Groceries"]}},
            {{"name": "Transportation", "amount": 0, "percentage": 0, "items": []}},
            {{"name": "Utilities", "amount": 0, "percentage": 0, "items": []}},
            {{"name": "Entertainment", "amount": 0, "percentage": 0, "items": []}},
            {{"name": "Health", "amount": 0, "percentage": 0, "items": []}},
            {{"name": "Other", "amount": 0, "percentage": 0, "items": []}}
        ],
        "insights": [
            "Specific insight about spending pattern 1",
            "Specific insight about spending pattern 2",
            "Specific insight about spending pattern 3"
        ],
        "expense_health_score": 75
    }},
    "budget_plan": {{
        "recommended_savings": 0,
        "savings_rate_percent": 0,
        "expense_limits": [
            {{"category": "Food & Dining", "current": 0, "recommended": 0, "action": "reduce/maintain/ok"}},
            {{"category": "Entertainment", "current": 0, "recommended": 0, "action": "reduce/maintain/ok"}}
        ],
        "monthly_targets": {{
            "needs": 0,
            "wants": 0,
            "savings": 0,
            "investments": 0
        }},
        "tips": [
            "Actionable budget tip 1",
            "Actionable budget tip 2",
            "Actionable budget tip 3"
        ]
    }},
    "investment_plan": {{
        "investable_amount": 0,
        "allocation": [
            {{"type": "Stocks / Equity MF", "percentage": 0, "amount": 0, "reason": "Why this allocation"}},
            {{"type": "Debt Mutual Funds", "percentage": 0, "amount": 0, "reason": "Why"}},
            {{"type": "Gold / Commodity", "percentage": 0, "amount": 0, "reason": "Why"}},
            {{"type": "Emergency Fund", "percentage": 0, "amount": 0, "reason": "Why"}},
            {{"type": "Crypto", "percentage": 0, "amount": 0, "reason": "Why"}}
        ],
        "rationale": "Overall investment strategy explanation in 2-3 sentences",
        "time_horizon": "short/medium/long term recommendation"
    }},
    "headline": "One catchy sentence summarizing the user's financial health"
}}

RULES:
- All amounts should be in INR (Rs.)
- Use the 50/30/20 rule as a baseline for budgeting (needs/wants/savings)
- Investment allocation should match the risk profile
- Be specific and actionable with insights
- expense_health_score: 0-100 where 100 is perfect expense management
- Categorize ALL expenses into the categories listed
- Return ONLY valid JSON, no markdown
"""

    try:
        response = client.chat.completions.create(
            model="asi1-mini",
            messages=[{"role": "user", "content": prompt}],
            stream=False,
        )

        raw = response.choices[0].message.content.strip()
        raw = raw.replace('```json', '').replace('```', '').strip()
        result = json.loads(raw)

        # Inject computed totals
        result["summary"] = {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "fixed_expenses": fixed_expenses,
            "variable_expenses": variable_expenses,
            "surplus": surplus,
            "risk_profile": req.risk_profile,
            "age": req.age
        }

        return result

    except json.JSONDecodeError as e:
        print(f"WealthPilot JSON Error: {e}")
        print(f"Raw response: {raw[:500] if 'raw' in dir() else 'N/A'}")
        # Return a safe fallback
        return generate_fallback(total_income, total_expenses, fixed_expenses, variable_expenses, surplus, req.risk_profile)
    except Exception as e:
        print(f"WealthPilot Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def generate_fallback(income, expenses, fixed, variable, surplus, risk):
    """Fallback response if AI fails."""
    savings = max(surplus * 0.5, 0)
    invest = max(surplus * 0.4, 0)

    return {
        "summary": {
            "total_income": income,
            "total_expenses": expenses,
            "fixed_expenses": fixed,
            "variable_expenses": variable,
            "surplus": surplus,
            "risk_profile": risk,
            "age": 25
        },
        "expense_analysis": {
            "categories": [
                {"name": "Fixed Expenses", "amount": fixed, "percentage": round(fixed / expenses * 100 if expenses else 0, 1), "items": []},
                {"name": "Variable Expenses", "amount": variable, "percentage": round(variable / expenses * 100 if expenses else 0, 1), "items": []}
            ],
            "insights": [
                f"Your fixed expenses account for {round(fixed/income*100)}% of income" if income else "No income data",
                f"You have Rs.{surplus:,.0f} surplus after expenses" if surplus > 0 else "Your expenses exceed your income",
            ],
            "expense_health_score": min(80, max(20, int(surplus / income * 100))) if income else 50
        },
        "budget_plan": {
            "recommended_savings": savings,
            "savings_rate_percent": round(savings / income * 100 if income else 0, 1),
            "expense_limits": [],
            "monthly_targets": {
                "needs": fixed,
                "wants": variable,
                "savings": savings,
                "investments": invest
            },
            "tips": [
                "Track your variable expenses weekly to identify patterns",
                "Aim to build a 6-month emergency fund before aggressive investing",
                "Consider automating your savings via SIP"
            ]
        },
        "investment_plan": {
            "investable_amount": invest,
            "allocation": [
                {"type": "Equity Mutual Funds", "percentage": 50, "amount": invest * 0.5, "reason": "Long-term wealth building"},
                {"type": "Debt Funds", "percentage": 20, "amount": invest * 0.2, "reason": "Stable returns"},
                {"type": "Emergency Fund", "percentage": 20, "amount": invest * 0.2, "reason": "Financial security"},
                {"type": "Gold/Crypto", "percentage": 10, "amount": invest * 0.1, "reason": "Diversification"}
            ],
            "rationale": "A balanced portfolio for steady growth with moderate risk.",
            "time_horizon": "medium"
        },
        "headline": f"You have Rs.{surplus:,.0f}/month to work with — let's put it to work."
    }
