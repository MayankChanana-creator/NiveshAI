from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter(prefix="/api/goal-plan", tags=["Goal Planner"])

class GoalRequest(BaseModel):
    target_amount: float
    timeframe_years: float
    risk_profile: str
    goal_name: str

class RebalanceRequest(BaseModel):
    goal_id: int
    goal_name: str
    target_amount: float
    timeframe_years: float
    current_return_rate: float
    target_return_rate: float
    risk_profile: str

class AssetRecommendation(BaseModel):
    symbol: str
    name: str
    type: str # 'Mutual Fund', 'Stock', 'Crypto'
    allocation_percent: float

class GoalResponse(BaseModel):
    target_amount: float
    timeframe_years: float
    monthly_sip: float
    expected_return_rate: float
    risk_profile: str
    goal_name: str
    recommended_assets: List[AssetRecommendation]

@router.post("/", response_model=GoalResponse)
async def generate_goal_plan(request: GoalRequest):
    profile = request.risk_profile.lower()
    
    # Set expected annual return rate based on risk profile
    if profile == "conservative":
        annual_rate = 0.08
    elif profile == "aggressive":
        annual_rate = 0.16
    else:
        # Default moderate
        annual_rate = 0.12
        profile = "moderate"
        
    # SIP Calculation
    months = request.timeframe_years * 12
    monthly_rate = annual_rate / 12
    
    # Formula: SIP = P * (r) / (((1 + r)^n - 1) * (1 + r))
    if monthly_rate > 0 and months > 0:
        sip_amount = request.target_amount * monthly_rate / (((1 + monthly_rate)**months - 1) * (1 + monthly_rate))
    else:
        sip_amount = request.target_amount / months if months > 0 else 0
        
    sip_amount = round(sip_amount, 2)
    
    # Recommend Assets based on Risk Profile
    recommendations = []
    
    if profile == "conservative":
        recommendations.extend([
            AssetRecommendation(symbol="120586", name="ICICI Prudential Bluechip Fund", type="Mutual Fund", allocation_percent=60.0),
            AssetRecommendation(symbol="119598", name="Axis Bluechip Fund", type="Mutual Fund", allocation_percent=40.0)
        ])
    elif profile == "aggressive":
        recommendations.extend([
            AssetRecommendation(symbol="120503", name="Nippon India Small Cap Fund", type="Mutual Fund", allocation_percent=50.0),
            AssetRecommendation(symbol="119062", name="SBI Small Cap Fund", type="Mutual Fund", allocation_percent=30.0),
            AssetRecommendation(symbol="bitcoin", name="Bitcoin", type="Crypto", allocation_percent=20.0)
        ])
    else:
        # Moderate
        recommendations.extend([
            AssetRecommendation(symbol="118268", name="Parag Parikh Flexi Cap Fund", type="Mutual Fund", allocation_percent=50.0),
            AssetRecommendation(symbol="125354", name="Quant Active Fund", type="Mutual Fund", allocation_percent=30.0),
            AssetRecommendation(symbol="RELIANCE.NS", name="Reliance Industries", type="Stock", allocation_percent=20.0)
        ])
        
    return GoalResponse(
        target_amount=request.target_amount,
        timeframe_years=request.timeframe_years,
        monthly_sip=sip_amount,
        expected_return_rate=annual_rate * 100,
        risk_profile=profile.capitalize(),
        goal_name=request.goal_name,
        recommended_assets=recommendations
    )


@router.post("/rebalance", response_model=GoalResponse)
async def auto_rebalance_plan(request: RebalanceRequest):
    # Determine new risk profile
    profile = request.risk_profile.lower()
    
    # If heavily underperforming, bump the risk profile up
    if request.current_return_rate < request.target_return_rate - 2.0:
        if profile == "conservative":
            profile = "moderate"
        elif profile == "moderate":
            profile = "aggressive"
            
    # Calculate new SIP and Recommendations exactly like the planner
    # but based on the new adjusted profile
    goal_request = GoalRequest(
        target_amount=request.target_amount,
        timeframe_years=request.timeframe_years,
        risk_profile=profile + " (Rebalanced)",
        goal_name=request.goal_name + " (Rebalanced)"
    )
    
    if profile.startswith("conservative"):
        annual_rate = 0.08
    elif profile.startswith("aggressive"):
        annual_rate = 0.16
    else:
        annual_rate = 0.12

    months = goal_request.timeframe_years * 12
    monthly_rate = annual_rate / 12
    if monthly_rate > 0 and months > 0:
        sip_amount = goal_request.target_amount * monthly_rate / (((1 + monthly_rate)**months - 1) * (1 + monthly_rate))
    else:
        sip_amount = goal_request.target_amount / months if months > 0 else 0
        
    sip_amount = round(sip_amount, 2)
    recommendations = []
    
    if profile.startswith("conservative"):
        recommendations.extend([
            AssetRecommendation(symbol="120586", name="ICICI Prudential Bluechip Fund", type="Mutual Fund", allocation_percent=50.0),
            AssetRecommendation(symbol="119598", name="Axis Bluechip Fund", type="Mutual Fund", allocation_percent=50.0)
        ])
    elif profile.startswith("aggressive"):
        recommendations.extend([
            AssetRecommendation(symbol="125354", name="Quant Active Fund", type="Mutual Fund", allocation_percent=40.0),
            AssetRecommendation(symbol="120503", name="Nippon India Small Cap Fund", type="Mutual Fund", allocation_percent=40.0),
            AssetRecommendation(symbol="bitcoin", name="Bitcoin", type="Crypto", allocation_percent=20.0)
        ])
    else:
        # Moderate
        recommendations.extend([
            AssetRecommendation(symbol="118268", name="Parag Parikh Flexi Cap Fund", type="Mutual Fund", allocation_percent=60.0),
            AssetRecommendation(symbol="RELIANCE.NS", name="Reliance Industries", type="Stock", allocation_percent=20.0),
            AssetRecommendation(symbol="119062", name="SBI Small Cap Fund", type="Mutual Fund", allocation_percent=20.0)
        ])
        
    return GoalResponse(
        target_amount=goal_request.target_amount,
        timeframe_years=goal_request.timeframe_years,
        monthly_sip=sip_amount,
        expected_return_rate=annual_rate * 100,
        risk_profile=profile.capitalize(),
        goal_name=goal_request.goal_name,
        recommended_assets=recommendations
    )

