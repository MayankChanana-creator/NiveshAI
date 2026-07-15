from openai import OpenAI
import os
from dotenv import load_dotenv
load_dotenv()
client = OpenAI(
    api_key=os.environ.get("ASI_API_KEY"),
    base_url="https://inference.asicloud.cudos.org/v1",
)

def explain_behaviour_llm(
    behaviour: str,
    loss: float,
    volatility: float,
    slope: float,
    holding_days: int
) -> str:

    prompt = f"""
You are a financial behaviour explanation AI.

Predicted behaviour: {behaviour}

Metrics:
- Loss Percentage: {loss:.2f}%
- Volatility: {volatility:.4f}
- NAV Trend: {slope:.4f}
- Holding Period: {holding_days} days

Explain clearly WHY this behaviour occurred.
Do NOT give financial advice.
"""

    
    response=client.chat.completions.create(
            model="asi1-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4
            
        )

    return response.choices[0].message.content
