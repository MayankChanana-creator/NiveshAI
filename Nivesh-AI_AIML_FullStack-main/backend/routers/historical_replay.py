from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/api/replay", tags=["Historical Replay"])

# Define Historical Scenarios
HISTORICAL_EVENTS = [
    {
        "id": "gfc_2008",
        "name": "2008 Great Financial Crisis",
        "description": "Navigate the collapse of Lehman Brothers and the global banking meltdown. Can you stay liquid when the world is panicking?",
        "start_date": "2008-01-01",
        "end_date": "2009-06-01",
        "assets": [
            {"symbol": "^GSPC", "name": "S&P 500 (US Market)"},
            {"symbol": "^NSEI", "name": "Nifty 50 (Indian Market)"},
            {"symbol": "GLD", "name": "Gold ETF"}
        ],
        "news": [
            {"date": "2008-03-16", "headline": "Bear Stearns collapses, JPMorgan to buy for $2/share."},
            {"date": "2008-09-15", "headline": "Lehman Brothers files for bankruptcy. Global markets in freefall!"},
            {"date": "2008-09-16", "headline": "Fed bails out AIG with $85 billion loan."},
            {"date": "2008-10-03", "headline": "TARP bailout bill signed into law by President Bush."},
            {"date": "2009-03-09", "headline": "S&P 500 hits '666' bottom. Is the worst over?"}
        ]
    },
    {
        "id": "covid_2020",
        "name": "2020 Covid Crash",
        "description": "Trade through the fastest crash in history and the subsequent massive stimulus rally.",
        "start_date": "2020-01-01",
        "end_date": "2021-01-01",
        "assets": [
            {"symbol": "^NSEI", "name": "Nifty 50"},
            {"symbol": "TSLA", "name": "Tesla Inc."},
            {"symbol": "BTC-USD", "name": "Bitcoin"}
        ],
        "news": [
            {"date": "2020-03-11", "headline": "WHO declares COVID-19 a global pandemic."},
            {"date": "2020-03-23", "headline": "India announces 21-day nationwide lockdown."},
            {"date": "2020-03-24", "headline": "US Fed announces unlimited Quantitative Easing (QE)."},
            {"date": "2020-04-20", "headline": "Crude Oil prices fall below zero for the first time in history!"},
            {"date": "2020-11-09", "headline": "Pfizer announces vaccine is 90% effective. Markets surge!"}
        ]
    },
    {
        "id": "crypto_2021",
        "name": "2021 Crypto Mania",
        "description": "The year of NFTs, Dogecoin, and Bitcoin hitting all-time highs. High volatility, high reward.",
        "start_date": "2021-01-01",
        "end_date": "2022-01-01",
        "assets": [
            {"symbol": "BTC-USD", "name": "Bitcoin"},
            {"symbol": "ETH-USD", "name": "Ethereum"},
            {"symbol": "DOGE-USD", "name": "Dogecoin"}
        ],
        "news": [
            {"date": "2021-02-08", "headline": "Tesla buys $1.5B in Bitcoin, plans to accept it as payment."},
            {"date": "2021-04-14", "headline": "Coinbase goes public on Nasdaq. Crypto enters the mainstream."},
            {"date": "2021-05-08", "headline": "Elon Musk hosts SNL. Dogecoin drops as he calls it a 'hustle'."},
            {"date": "2021-06-05", "headline": "El Salvador makes Bitcoin legal tender."},
            {"date": "2021-11-10", "headline": "Bitcoin hits all-time high of $69,044."}
        ]
    },
    {
        "id": "ai_2024",
        "name": "2024 AI Gold Rush",
        "description": "Nvidia and the AI giants are redrawing the financial map. Ride the generative AI wave.",
        "start_date": "2023-10-01",
        "end_date": "2024-05-01",
        "assets": [
            {"symbol": "NVDA", "name": "NVIDIA Corporation"},
            {"symbol": "MSFT", "name": "Microsoft"},
            {"symbol": "SMCI", "name": "Super Micro Computer"}
        ],
        "news": [
            {"date": "2023-11-21", "headline": "Nvidia reports 206% revenue growth. AI demand is 'astounding'."},
            {"date": "2024-02-15", "headline": "OpenAI reveals 'Sora' text-to-video model. AI stocks rally."},
            {"date": "2024-02-22", "headline": "Nvidia gains $277B in market cap in a single day—a Wall Street record."},
            {"date": "2024-03-18", "headline": "Nvidia unveils Blackwell B200 GPU at GTC conference."}
        ]
    }
]

@router.get("/events")
async def get_events():
    """Returns the list of historical scenarios"""
    return HISTORICAL_EVENTS

@router.get("/data")
async def get_replay_data(
    event_id: str = Query(...),
    symbol: str = Query(...)
):
    """Fetches historical OHLC data and news for a specific scenario and asset"""
    event = next((e for e in HISTORICAL_EVENTS if e["id"] == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    try:
        ticker = yf.Ticker(symbol)
        
        start_dt = event["start_date"]
        end_dt = event["end_date"]
        
        df = ticker.history(start=start_dt, end=end_dt, interval="1d", auto_adjust=False)
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol} in this era.")
            
        df = df.reset_index()
        
        # GET SPLITS to reverse adjustment
        splits = ticker.splits
        
        # Robust column name detection
        cols = {col.lower(): col for col in df.columns}
        date_col = cols.get('date') or 'Date'
        open_col = cols.get('open') or 'Open'
        high_col = cols.get('high') or 'High'
        low_col = cols.get('low') or 'Low'
        close_col = cols.get('close') or 'Close'
        vol_col = cols.get('volume') or 'Volume'

        candles = []
        for _, row in df.iterrows():
            try:
                val_date = row[date_col]
                if hasattr(val_date, 'strftime'):
                    date_str = val_date.strftime("%Y-%m-%d")
                    row_dt = pd.to_datetime(val_date).tz_localize(None) if hasattr(val_date, 'tz') else pd.to_datetime(val_date)
                else:
                    date_str = str(val_date)[:10]
                    row_dt = pd.to_datetime(date_str)

                # Calculate cumulative split factor
                multiplier = 1.0
                if not splits.empty:
                    splits_clean = splits.copy()
                    splits_clean.index = splits_clean.index.tz_localize(None)
                    future_splits = splits_clean[splits_clean.index > row_dt]
                    for split_val in future_splits:
                        if split_val > 0:
                            multiplier *= split_val

                candles.append({
                    "date": date_str,
                    "open": float(row[open_col]) * multiplier,
                    "high": float(row[high_col]) * multiplier,
                    "low": float(row[low_col]) * multiplier,
                    "close": float(row[close_col]) * multiplier,
                    "volume": int(row[vol_col]) if vol_col in row and not pd.isna(row[vol_col]) else 0
                })
            except Exception as row_err:
                print(f"Error parsing row: {row_err}")
                continue
            
        if not candles:
             raise HTTPException(status_code=404, detail=f"Data parsing failed for {symbol}")

        # Get currency info
        try:
            currency = ticker.fast_info.currency if hasattr(ticker.fast_info, 'currency') else ticker.info.get('currency', 'USD')
        except:
            currency = 'USD'

        return {
            "event": event["name"],
            "description": event["description"],
            "symbol": symbol,
            "currency": currency,
            "candles": candles,
            "news": event["news"]
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Replay Data Error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
