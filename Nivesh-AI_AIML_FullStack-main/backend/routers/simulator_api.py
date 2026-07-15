from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.simulator_service import simulate_behaviour
from stock_api import get_stock_history
from mf_api import fetch_historical_nav
import pandas as pd

router = APIRouter(prefix="/api/simulator", tags=["Simulator"])

class SimulationRequest(BaseModel):
    symbol: str
    item_type: str  # 'stock' | 'mutual_fund'
    behaviour: str  # 'panic' | 'calm' | 'greedy' | 'neutral'
    initial_investment: float = 100000

@router.post("/simulate")
async def run_simulation(req: SimulationRequest):
    try:
        history_data = []
        if req.item_type == "stock":
            # Fetch 1 year of history
            rows = await get_stock_history(req.symbol, period="1y", interval="1d")
            history_data = [{"date": r["date"], "close": r["close"]} for r in rows]
        
        elif req.item_type == "mutual_fund":
            nav_data = fetch_historical_nav(req.symbol)
            if not nav_data:
                raise HTTPException(status_code=404, detail="No MF data found")
            
            # Convert to standard format
            history_data = [{"date": r["date"], "close": float(r["nav"])} for r in nav_data]
            # Take last ~250 days (approx 1 year of trading)
            history_data = history_data[-250:]

        if not history_data:
            raise HTTPException(status_code=404, detail="Could not fetch history for simulation")

        results = simulate_behaviour(
            history_data, 
            req.behaviour, 
            req.initial_investment
        )

        # Calculate summary statistics
        final_value = results[-1]["portfolio_value"] if results else req.initial_investment
        profit_loss = final_value - req.initial_investment
        profit_percent = (profit_loss / req.initial_investment) * 100

        # Calculate "Market" performance (buy and hold) for comparison
        market_results = simulate_behaviour(history_data, 'neutral', req.initial_investment)
        market_final_value = market_results[-1]["portfolio_value"] if market_results else req.initial_investment
        market_profit_percent = ((market_final_value - req.initial_investment) / req.initial_investment) * 100

        # Calculate Volatility Stats
        avg_volatility = pd.Series([r["volatility"] for r in results if r["volatility"] > 0]).mean()
        anomaly_count = sum(1 for r in results if r.get("is_anomaly"))

        return {
            "symbol": req.symbol,
            "behaviour": req.behaviour,
            "timeline": results,
            "summary": {
                "initial_investment": req.initial_investment,
                "final_value": final_value,
                "profit_loss": profit_loss,
                "profit_percent": profit_percent,
                "market_profit_percent": market_profit_percent,
                "outperformance": profit_percent - market_profit_percent,
                "volatility_stats": {
                    "avg_volatility": float(avg_volatility) if not pd.isna(avg_volatility) else 0,
                    "anomaly_count": int(anomaly_count)
                }
            }
        }

    except Exception as e:
        print(f"Simulation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
