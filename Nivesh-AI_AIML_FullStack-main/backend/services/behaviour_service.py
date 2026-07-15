import joblib
import pandas as pd

MODEL_PATH = "behaviour_model.pkl"
model = joblib.load(MODEL_PATH)

def predict_investor_behaviour(features: dict) -> str:
    df = pd.DataFrame([features])
    return model.predict(df)[0]
