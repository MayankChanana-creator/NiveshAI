import pandas as pd
import requests
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os
from dotenv import load_dotenv
load_dotenv()
np.random.seed(42)
MODEL_PATH = "behaviour_model.pkl"
url = "https://api.mfapi.in/mf"
headers = {"User-Agent": "Mozilla/5.0"}
response = requests.get(url,headers=headers)
schemes = response.json()
df = pd.DataFrame(schemes)
Company = int(input("Enter the number: "))
scheme_code = df.iloc[Company]["schemeCode"]
nav_url = f"https://api.mfapi.in/mf/{scheme_code}"
nav_data = requests.get(nav_url,headers=headers).json()
df_nav = pd.DataFrame(nav_data["data"])
df_nav["nav"] = df_nav["nav"].astype(float)
df_nav["date"] = pd.to_datetime(df_nav["date"],dayfirst=True)
df_nav = df_nav.sort_values("date")
holding_days = int(input("Enter the number of days you want to hold the stocks: "))
buy_nav = df_nav.iloc[-holding_days]["nav"]
buy_date = df_nav.iloc[-holding_days]["date"]
current_nav = df_nav.iloc[-1]["nav"]
loss_percent = ((current_nav-buy_nav)/buy_nav)*100
current_date = pd.Timestamp.now()
print(df.iloc[6])
print(loss_percent)

nav_slice = df_nav.iloc[-holding_days:].copy()
returns = nav_slice["nav"].pct_change().dropna()
volatility = returns.std()
nav_slope = (current_nav - buy_nav)/buy_nav
nav_slice["daily_return"] = nav_slice["nav"].pct_change()*100
threshold = -2
trigger_day = nav_slice[nav_slice["daily_return"] <= threshold].index.min()
if trigger_day is not None:
    reaction_time = (df_nav.index[-1] - trigger_day)
else:
    reaction_time = holding_days
if loss_percent < -5 and reaction_time < 2:
    behaviour = "Panic Sell"
elif loss_percent < 0  and nav_slope < 0:
    behaviour = "Nervous Hold"
elif loss_percent >= 0 and nav_slope > 0 and volatility < 0.02:
    behaviour = "Satisfied Hold"
elif loss_percent > 5:
    behaviour = "Greedy/Overconfident"
else:
    behaviour = "Neutral"
    
if not os.path.exists(MODEL_PATH):

    sim_data = pd.DataFrame({
        "loss_percent": np.random.uniform(-15, 15, 2000),
        "volatility": np.random.uniform(0.005, 0.05, 2000),
        "nav_slope": np.random.uniform(-0.15, 0.15, 2000),
        "holding_days": np.random.randint(10, 120, 2000),
        "reaction_time": np.random.uniform(0.1, 5, 2000),
    })

    def label_behaviour(row):
        if row["loss_percent"] < -5 and row["reaction_time"] < 2:
            return "Panic Sell"
        elif row["loss_percent"] < 0 and row["nav_slope"] < 0:
            return "Nervous Hold"
        elif row["loss_percent"] >= 0 and row["nav_slope"] > 0 and row["volatility"] < 0.02:
            return "Satisfied Hold"
        elif row["loss_percent"] > 5:
            return "Greedy/Overconfident"
        else:
            return "Neutral"

    sim_data["behaviour"] = sim_data.apply(label_behaviour, axis=1)

    X = sim_data.drop("behaviour", axis=1)
    y = sim_data["behaviour"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=6,
        min_samples_leaf=10,
        random_state=42
    )

    model.fit(X_train, y_train)

    joblib.dump(model, MODEL_PATH)

model = joblib.load(MODEL_PATH)
def explain_behaviour_llama(behaviour, loss, volatility, slope, holding_days):
    prompt = f"""
You are a financial behaviour analysis AI.

Predicted behaviour: {behaviour}

Metrics:
- Loss Percentage: {loss:.2f}%
- Volatility: {volatility:.4f}
- NAV Trend: {slope:.4f}
- Holding Period: {holding_days} days

Explain WHY this behaviour occurred.
Do NOT give financial advice.
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "phi3",
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )

        data = response.json()

        if "response" in data:
            return data["response"].strip()
        elif "error" in data:
            return f"LLM Error: {data['error']}"
        else:
            return f"Unexpected LLM output: {data}"

    except Exception as e:
        return f"LLM unavailable: {str(e)}"

user_input = pd.DataFrame({
    "loss_percent": [loss_percent],
    "volatility": [volatility],
    "nav_slope": [nav_slope],
    "holding_days": [holding_days],
    "reaction_time": [reaction_time],
})

predicted_behaviour = model.predict(user_input)[0]
print("Predicted Behaviour:",predicted_behaviour)
explanation = explain_behaviour_llama(
    predicted_behaviour,
    loss_percent,
    volatility,
    nav_slope,
    holding_days
)

print("\n Behaviour Explanation:")
print(explanation)