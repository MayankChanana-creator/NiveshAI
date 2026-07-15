from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI
import os
import json
import random
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

router = APIRouter(prefix="/api/learn", tags=["Learning Agent"])

# OpenAI client setup (using existing AsiCloud configuration)
client = OpenAI(
    api_key=os.environ.get("ASI_API_KEY"),
    base_url="https://inference.asicloud.cudos.org/v1",
)

# Curated Knowledge Base for RAG
KNOWLEDGE_BASE = {
    "compound_interest": {
        "title": "Compound Interest",
        "content": "Compound interest is the interest on a loan or deposit calculated based on both the initial principal and the accumulated interest from previous periods. It is often described as 'interest on interest' and is a powerful tool for long-term wealth creation. The formula is A = P(1 + r/n)^(nt).",
        "keywords": ["compound", "interest", "wealth", "long-term", "formula"]
    },
    "sip": {
        "title": "Systematic Investment Plan (SIP)",
        "content": "A Systematic Investment Plan (SIP) is a method of investing a fixed sum of money at regular intervals in a mutual fund. It helps in rupee cost averaging and brings discipline to investing. You don't need to 'time the market' with SIPs.",
        "keywords": ["sip", "regular", "mutual fund", "discipline", "averaging"]
    },
    "diversification": {
        "title": "Diversification",
        "content": "Diversification is a risk management strategy that mixes a wide variety of investments within a portfolio. A diversified portfolio contains a mix of distinct asset classes and investment vehicles in an attempt at limiting exposure to any single asset or risk.",
        "keywords": ["diversification", "risk", "portfolio", "asset", "limit", "exposure"]
    },
    "bull_bear": {
        "title": "Bull and Bear Markets",
        "content": "A bull market is a market that is on the rise and where the economy is sound, while a bear market is one that is in a decline and typically where most stocks are declining in value. A 20% drop from recent highs often defines a bear market.",
        "keywords": ["bull", "bear", "market", "rise", "fall", "decline", "trend"]
    },
    "etf": {
        "title": "Exchange Traded Funds (ETF)",
        "content": "An ETF is a type of investment fund and exchange-traded product, i.e., they are traded on stock exchanges. ETFs are similar in many ways to mutual funds, except that ETFs are bought and sold throughout the day on stock exchanges.",
        "keywords": ["etf", "exchange", "fund", "trade", "stock"]
    },
    "inflation": {
        "title": "Inflation",
        "content": "Inflation is the rate at which the general level of prices for goods and services is rising and, consequently, the purchasing power of currency is falling. Central banks attempt to limit inflation, and avoid deflation, in order to keep the economy running smoothly.",
        "keywords": ["inflation", "prices", "purchasing power", "economy", "rise"]
    },
    "asset_allocation": {
        "title": "Asset Allocation",
        "content": "Asset allocation is an investment strategy that aims to balance risk versus reward by apportioning a portfolio's assets according to an individual's goals, risk tolerance, and investment horizon. The three main asset classes are equities, fixed-income, and cash and equivalents.",
        "keywords": ["allocation", "balance", "risk", "reward", "equities", "cash"]
    },
    "pe_ratio": {
        "title": "P/E Ratio",
        "content": "The price-to-earnings ratio (P/E ratio) is the ratio for valuing a company that measures its current share price relative to its earnings per share (EPS). It indicates how much the market is willing to pay for every dollar of earnings.",
        "keywords": ["pe", "ratio", "valuation", "earnings", "price", "share"]
    },
    "dividends": {
        "title": "Dividends",
        "content": "A dividend is the distribution of some of a company's earnings to a class of its shareholders, as determined by the company's board of directors. Common shareholders of dividend-paying companies are typically eligible as long as they own the stock before the ex-dividend date.",
        "keywords": ["dividend", "distribution", "shareholders", "earnings", "payout"]
    }
}

class ChatRequest(BaseModel):
    message: str
    history: list = []

def get_context(query: str):
    """Simple keyword-based retrieval logic for RAG."""
    query_lower = query.lower()
    relevant_context = []
    for key, data in KNOWLEDGE_BASE.items():
        if any(kw in query_lower for kw in data["keywords"]):
            relevant_context.append(f"Topic: {data['title']}\nContent: {data['content']}")
    
    return "\n\n".join(relevant_context) if relevant_context else "No specific context found. Answer using general financial knowledge."

@router.post("/ask")
async def ask_tutor(request: ChatRequest):
    context = get_context(request.message)
    
    system_prompt = f"""
    You are 'WealthWise', a friendly and expert AI Financial Tutor for WealthPulse.
    Your goal is to explain financial concepts clearly using simple language.
    
    CONTEXT KNOWLEDGE BASE:
    {context}
    
    RULES:
    1. Use the provided context where relevant.
    2. If the user asks something outside the context but related to finance, answer accurately.
    3. Keep explanations concise and use bullet points where helpful.
    4. Proactively offer to explain related terms.
    5. DO NOT provide specific investment advice or individual stock tips.
    """
    
    messages = [{"role": "system", "content": system_prompt}]
    # Add history
    for msg in request.history[-5:]: # Keep last 5 messages for context
        messages.append(msg)
    messages.append({"role": "user", "content": request.message})

    def stream():
        completion = client.chat.completions.create(
            model="asi1-mini",
            messages=messages,
            stream=True,
        )
        for chunk in completion:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    return StreamingResponse(stream(), media_type="text/plain")

class QuizRequest(BaseModel):
    difficulty: str = "medium"  # easy | medium | hard
    portfolio: list = []  # optional list of {"symbol": ..., "name": ..., "item_type": ...}
    topic: str = ""  # optional specific topic

@router.post("/quiz")
async def generate_quiz(request: QuizRequest = QuizRequest()):
    """Generate a quiz question — portfolio-aware if holdings are provided."""
    
    portfolio_context = ""
    use_portfolio = len(request.portfolio) > 0 and random.random() < 0.6  # 60% chance to use portfolio context
    
    if use_portfolio:
        holdings_desc = ", ".join([f"{h.get('name', h.get('symbol',''))} ({h.get('item_type','stock')})" for h in request.portfolio[:10]])
        portfolio_context = f"""
        The user's portfolio contains: {holdings_desc}.
        Generate a question that is RELEVANT to their holdings — for example, about the sector, 
        asset type, risk profile, or financial concepts related to the assets they own.
        Make the question educational and help them understand their own investments better.
        """
    
    # Pick a topic
    if request.topic and request.topic in KNOWLEDGE_BASE:
        topic = KNOWLEDGE_BASE[request.topic]
    else:
        topic_key = random.choice(list(KNOWLEDGE_BASE.keys()))
        topic = KNOWLEDGE_BASE[topic_key]
    
    difficulty_guidance = {
        "easy": "Make the question simple and beginner-friendly. Use clear, straightforward language.",
        "medium": "Make the question moderately challenging. Test understanding, not just memorization.",
        "hard": "Make the question advanced and analytical. Require deeper understanding and reasoning."
    }
    
    prompt = f"""
    Generate a creative and educational finance quiz question.
    
    Topic: {topic['title']}
    Context: {topic['content']}
    Difficulty: {request.difficulty} — {difficulty_guidance.get(request.difficulty, difficulty_guidance['medium'])}
    {portfolio_context}
    
    IMPORTANT RULES:
    - The question must be factual and have ONE clearly correct answer.
    - All 4 options must be plausible but only one is correct.
    - The explanation must be educational and concise (2-3 sentences max).
    - Do NOT reference the user directly or say "your portfolio".
    
    Return ONLY valid JSON (no markdown, no code blocks):
    {{
        "question": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer": "The exact text of the correct option",
        "explanation": "A short explanation of why it is correct",
        "topic": "{topic['title']}",
        "difficulty": "{request.difficulty}"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="asi1-mini",
            messages=[{"role": "user", "content": prompt}],
            stream=False,
        )
        
        raw = response.choices[0].message.content.strip()
        # Clean potential markdown formatting
        raw = raw.replace('```json', '').replace('```', '').strip()
        quiz_data = json.loads(raw)
        
        # Ensure required fields exist
        required = ["question", "options", "correct_answer", "explanation", "topic"]
        for field in required:
            if field not in quiz_data:
                raise ValueError(f"Missing field: {field}")
        
        quiz_data["difficulty"] = request.difficulty
        quiz_data["is_portfolio_based"] = use_portfolio
        return quiz_data
        
    except Exception as e:
        print(f"Quiz Generation Error: {e}")
        # Fallback quiz
        return {
            "question": "What is the primary benefit of diversification?",
            "options": ["Higher guaranteed returns", "Reduced portfolio risk", "Tax-free gains", "Zero volatility"],
            "correct_answer": "Reduced portfolio risk",
            "explanation": "Diversification helps lower overall portfolio risk by spreading investments across different asset classes, so a decline in one doesn't devastate the entire portfolio.",
            "topic": "Diversification",
            "difficulty": request.difficulty,
            "is_portfolio_based": False
        }

