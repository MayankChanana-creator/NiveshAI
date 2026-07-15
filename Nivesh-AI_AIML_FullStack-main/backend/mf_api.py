from fastapi import APIRouter, HTTPException
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import pandas as pd
import numpy as np
import logging

router = APIRouter(prefix="/api/mutual", tags=["Mutual Funds"])

MFAPI_BASE_URL = "https://api.mfapi.in"

# Setup robust session
session = requests.Session()
retries = Retry(total=3, backoff_factor=0.5, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
})

POPULAR_FUNDS = {
    "120503": "Nippon India Small Cap Fund - Direct Plan - Growth",
    "119062": "SBI Small Cap Fund - Direct Plan - Growth",
    "118268": "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
    "120586": "ICICI Prudential Bluechip Fund - Direct Plan - Growth",
    "119598": "Axis Bluechip Fund - Direct Plan - Growth",
    "125354": "Quant Active Fund - Direct Plan - Growth",
    "146747": "Mirae Asset Emerging Bluechip Fund - Direct Plan - Growth",
    "118834": "HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth",
    "120465": "Kotak Emerging Equity Fund - Direct Plan - Growth",
    "119803": "UTI Nifty 50 Index Fund - Direct Plan - Growth",
    "118989": "HDFC Small Cap Fund - Direct Plan - Growth"
}

_schemes_cache = {}

def fetch_all_schemes():
    global _schemes_cache
    if _schemes_cache:
        return _schemes_cache

    url = f"{MFAPI_BASE_URL}/mf"
    try:
        r = session.get(url, timeout=15)
        if r.ok:
            data = r.json()
            # api.mfapi.in returns a huge list, cache it
            _schemes_cache = {item["schemeCode"]: item["schemeName"] for item in data}
            return _schemes_cache
    except Exception as e:
        logging.error(f"Error fetching all schemes: {e}")
    
    # Fallback if API fails completely
    return POPULAR_FUNDS

def fetch_scheme_details(scheme_code):
    url = f"{MFAPI_BASE_URL}/mf/{scheme_code}"
    try:
        r = session.get(url, timeout=15)
        if r.ok:
            meta = r.json().get("meta", {})
            return meta
    except Exception as e:
        logging.error(f"Error fetching scheme details {scheme_code}: {e}")
    return {}

def fetch_historical_nav(scheme_code):
    url = f"{MFAPI_BASE_URL}/mf/{scheme_code}"
    try:
        r = session.get(url, timeout=15)
        if r.ok:
            return r.json().get("data", [])
    except Exception as e:
        logging.error(f"Error fetching historical nav for {scheme_code}: {e}")
    return []

@router.get("/schemes")
async def get_schemes(search: str = ""):
    all_schemes = fetch_all_schemes()
    if search:
        filtered = {code: name for code, name in all_schemes.items() if search.lower() in name.lower()}
        return filtered if filtered else {}
    return all_schemes

@router.get("/scheme-details/{scheme_code}")
async def get_scheme_details(scheme_code: str):
    details = fetch_scheme_details(scheme_code)
    if not details:
        # Fallback: Try to get scheme name from full data
        url = f"{MFAPI_BASE_URL}/mf/{scheme_code}"
        try:
            r = session.get(url, timeout=15)
            if r.ok:
                full_data = r.json()
                meta = full_data.get("meta", {})
                if meta:
                    return meta
                # If meta is empty, return scheme name from the response
                return {
                    "scheme_name": full_data.get("scheme_name", ""),
                    "fund_house": full_data.get("fund_house", ""),
                    "scheme_type": full_data.get("scheme_type", ""),
                    "scheme_category": full_data.get("scheme_category", "")
                }
        except Exception as e:
            logging.error(f"Error in fallback fetching scheme details {scheme_code}: {e}")
    return details

@router.get("/historical-nav/{scheme_code}")
async def get_historical_nav(scheme_code: str):
    return fetch_historical_nav(scheme_code) or []

@router.get("/compare-navs")
async def compare_navs(scheme_codes: str):
    codes = scheme_codes.split(",")
    comparison_data = {}
    for code in codes:
        navs = fetch_historical_nav(code.strip())
        if navs:
            df = pd.DataFrame(navs)
            df["date"] = pd.to_datetime(df["date"], dayfirst=True)
            df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
            df = df.dropna(subset=["nav"])
            df = df.set_index("date")
            comparison_data[code] = df["nav"]
    if comparison_data:
        combined = pd.concat(comparison_data.values(), axis=1, keys=comparison_data.keys()).reset_index()
        combined.columns = ["date"] + [f"{code}_nav" for code in comparison_data.keys()]
        return combined.fillna("").astype(str).to_dict(orient="records")
    return []

import math

def clean_dict(data):
    if isinstance(data, dict):
        return {k: clean_dict(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_dict(v) for v in data]
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return None
        return data
    return data

@router.get("/performance-heatmap/{scheme_code}")
async def get_performance_heatmap(scheme_code: str):
    navs = fetch_historical_nav(scheme_code)
    if navs:
        df = pd.DataFrame(navs)
        df["date"] = pd.to_datetime(df["date"], dayfirst=True)
        df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
        df.dropna(subset=["nav"], inplace=True)
        
        # Calculate monthly returns
        df["year"] = df["date"].dt.year
        df["month"] = df["date"].dt.month
        
        # Get first and last NAV of each month
        monthly_data = df.groupby(["year", "month"]).agg({
            "nav": ["first", "last"]
        }).reset_index()
        monthly_data.columns = ["year", "month", "first_nav", "last_nav"]
        
        # Calculate percentage change
        monthly_data["value"] = ((monthly_data["last_nav"] - monthly_data["first_nav"]) / monthly_data["first_nav"]) 
        monthly_data["nav"] = monthly_data["last_nav"]
        
        heatmap = monthly_data[["year", "month", "value", "nav"]].to_dict(orient="records")
        return clean_dict(heatmap)
    return []

@router.get("/risk-volatility/{scheme_code}")
async def get_risk_volatility(scheme_code: str):
    navs = fetch_historical_nav(scheme_code)
    if not navs:
        return {
            "annualized_volatility": 0.0,
            "annualized_return": 0.0,
            "sharpe_ratio": 0.0,
            "returns": []
        }
    df = pd.DataFrame(navs)
    df["date"] = pd.to_datetime(df["date"], dayfirst=True)
    df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
    df.dropna(subset=["nav"], inplace=True)
    df["returns"] = df["nav"].pct_change()
    df.dropna(subset=["returns"], inplace=True)
    annualized_volatility = df["returns"].std() * (252**0.5)
    annualized_return = (df["returns"].mean() + 1) ** 252 - 1
    risk_free_rate = 0.06
    sharpe_ratio = (annualized_return - risk_free_rate) / annualized_volatility if annualized_volatility > 0 else 0.0
    returns_list = [
        {"date": row["date"].strftime("%Y-%m-%d"), "returns": round(row["returns"], 8)}
        for idx, row in df.iterrows()
    ]
    return clean_dict({
        "annualized_volatility": float(annualized_volatility),
        "annualized_return": float(annualized_return),
        "sharpe_ratio": float(sharpe_ratio),
        "returns": returns_list
    })

@router.get("/monte-carlo-prediction/{scheme_code}")
async def get_monte_carlo_prediction(scheme_code: str, num_simulations: int = 1000, days: int = 252):
    navs = fetch_historical_nav(scheme_code)
    if not navs:
        return {"message": "No NAV data"}
    df = pd.DataFrame(navs)
    df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
    df = df.dropna(subset=["nav"])
    df["returns"] = df["nav"].pct_change()
    df = df.dropna(subset=["returns"])
    if len(df["returns"]) < 2:
        return {"message": "Insufficient data for Monte Carlo simulation"}
    mu = df["returns"].mean()
    sigma = df["returns"].std()
    
    # Check if mu/sigma is NaN
    if pd.isna(mu) or pd.isna(sigma) or sigma == 0:
        return {"message": "Invalid statistical data for simulation"}

    last_nav = float(df["nav"].iloc[-1])
    simulations = np.zeros((num_simulations, days))
    simulations[:, 0] = last_nav
    for t in range(1, days):
        random_returns = np.random.normal(mu, sigma, num_simulations)
        simulations[:, t] = simulations[:, t - 1] * (1 + random_returns)
    expected_nav = float(np.nanmean(simulations[:, -1]))
    prob_positive = float(np.nanmean(simulations[:, -1] > last_nav))
    percentile_5 = float(np.nanpercentile(simulations[:, -1], 5))
    percentile_95 = float(np.nanpercentile(simulations[:, -1], 95))
    
    # Prepare simulation paths for visualization (sample 4 simulations)
    simulation_paths = []
    for i in range(min(4, num_simulations)):
        simulation_paths.append({
            "name": f"Simulation {i + 1}",
            "data": [{"day": day, "value": float(simulations[i, day]) if not np.isnan(simulations[i, day]) else None} for day in range(0, days, 5)]  # Every 5 days
        })
    
    # Historical + Predicted path
    historical_predicted = [{"day": day, "value": float(np.nanmean(simulations[:, day]))} for day in range(0, days, 5)]
    
    return clean_dict({
        "expected_nav": expected_nav,
        "probability_positive_return": prob_positive * 100,
        "lower_bound_5th_percentile": percentile_5,
        "upper_bound_95th_percentile": percentile_95,
        "last_nav": last_nav,
        "simulation_paths": simulation_paths,
        "historical_predicted": historical_predicted
    })
