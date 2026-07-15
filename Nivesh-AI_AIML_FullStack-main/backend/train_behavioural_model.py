import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

np.random.seed(42)
MODEL_PATH = "behaviour_model.pkl"

# Simulated training data
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

model = RandomForestClassifier(
    n_estimators=150,
    max_depth=6,
    min_samples_leaf=10,
    random_state=42
)

model.fit(X, y)
joblib.dump(model, MODEL_PATH)

print("✅ Behaviour model trained & saved")
