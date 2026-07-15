import pandas as pd

def build_behaviour_features(nav_data: list, holding_days: int):

    df = pd.DataFrame(nav_data)

    # 🔑 Normalize NAV column (this fixes the bug)
    if "nav" in df.columns:
        nav_col = "nav"
    elif "value" in df.columns:
        nav_col = "value"
    elif "navValue" in df.columns:
        nav_col = "navValue"
    else:
        raise ValueError(f"NAV column not found. Available columns: {df.columns.tolist()}")

    df["nav"] = df[nav_col].astype(float)

    # Date handling
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], dayfirst=True)
        df = df.sort_values("date")

    if holding_days >= len(df):
        raise ValueError("Holding days exceed available NAV history")

    buy_nav = df.iloc[-holding_days]["nav"]
    current_nav = df.iloc[-1]["nav"]

    loss_percent = ((current_nav - buy_nav) / buy_nav) * 100

    returns = df["nav"].pct_change().dropna()
    volatility = returns.std()

    nav_slope = (current_nav - buy_nav) / buy_nav

    df["daily_return"] = df["nav"].pct_change() * 100
    trigger = df[df["daily_return"] <= -2]

    reaction_time = (
        float(df.index[-1] - trigger.index[0])
        if not trigger.empty
        else float(holding_days)
    )

    return {
        "loss_percent": round(loss_percent, 2),
        "volatility": round(volatility, 4),
        "nav_slope": round(nav_slope, 4),
        "holding_days": holding_days,
        "reaction_time": reaction_time
    }
