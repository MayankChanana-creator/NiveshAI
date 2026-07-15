from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI
import os
import json
from dotenv import load_dotenv
from stock_api import get_stock_quote, get_stock_news
from services.behaviour_service import predict_investor_behaviour
from services.llm_explainer import explain_behaviour_llm
from mf_api import get_historical_nav
from services.feature_engineering import build_behaviour_features
from pydantic import BaseModel
from services.mutual_service import fetch_historical_nav



load_dotenv()

router = APIRouter(prefix="/api/ai", tags=["AI"])

client = OpenAI(
    api_key=os.environ.get("ASI_API_KEY"),
    base_url="https://inference.asicloud.cudos.org/v1",
)
from pydantic import BaseModel

class BehaviourInput(BaseModel):
    loss_percent: float
    volatility: float
    nav_slope: float
    holding_days: int
    reaction_time: float
class MFBehaviourInput(BaseModel):
    scheme_code: int
    holding_days: int


@router.post("/analyze-stock")
async def analyze_stock(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    prompt = body.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    def stream():
        completion = client.chat.completions.create(
            model="asi1-mini",
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )

        for chunk in completion:
            delta = chunk.choices[0].delta
            if delta.content is not None:
                yield delta.content

    return StreamingResponse(stream(), media_type="text/plain")


@router.post("/summarize")
async def summarize_portfolio(request: Request):
    try:
        body = await request.json()
        prompt = body.get("prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt required")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    def stream():
        completion = client.chat.completions.create(
            model="asi1-mini",
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )

        for chunk in completion:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    return StreamingResponse(stream(), media_type="text/plain")


MARKET_CONTEXT_PROMPT = """
You are a Market Context Explainer for Indian markets.

Rules:
- Explain ONLY using the data provided
- Do NOT give buy/sell advice
- Do NOT predict future prices
- Use simple language
- Explain for beginners
"""
async def explain_stock_context(symbol: str):
    stock_data = await get_stock_quote(symbol)
    

    price = stock_data.price
    prev_close = stock_data.previousClose
    day_high = stock_data.dayHigh
    day_low = stock_data.dayLow
    volume = stock_data.volume

    movement = round(price - prev_close, 2)
    movement_percent = round((movement / prev_close) * 100, 2)

    user_prompt = f"""
Stock Symbol: {stock_data.symbol}
Current Price: {price} INR
Previous Close: {prev_close} INR
Intraday High: {day_high} INR
Intraday Low: {day_low} INR
Volume: {volume}
Price Change: {movement} INR ({movement_percent}%)



Explain clearly:
- What happened today
- Why this movement likely occurred
- Keep it simple
- No advice, no prediction
"""

    
    response= client.chat.completions.create(
            model="asi1-mini",
            messages=[
                {"role": "system", "content": MARKET_CONTEXT_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            stream=False,
        )

    return response.choices[0].message.content



@router.post("/des-stock", operation_id="ai_describe_stock_v1")
async def analyze_stock(symbol: str):
    explanation = await explain_stock_context(symbol)
    return {
        "symbol": symbol,
        "analysis": explanation
    }



from services.mutual_service import fetch_historical_nav

@router.post(
    "/behaviour-mf",
    operation_id="behaviour_mf_v1"
)
async def mutual_fund_behaviour(
    scheme_code: int,
    holding_days: int
):
    nav_data = fetch_historical_nav(scheme_code)

    print("NAV SAMPLE:", nav_data[:5])

    if not nav_data:
        raise HTTPException(
            status_code=404,
            detail="No NAV data available"
        )

    features = build_behaviour_features(nav_data, holding_days)

    behaviour = predict_investor_behaviour(features)

    explanation = explain_behaviour_llm(
        behaviour,
        features["loss_percent"],
        features["volatility"],
        features["nav_slope"],
        features["holding_days"]
    )

    return {
        "scheme_code": scheme_code,
        "predicted_behaviour": behaviour,
        "explanation": explanation
    }
