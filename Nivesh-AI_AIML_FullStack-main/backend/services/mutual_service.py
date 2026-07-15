import requests

MF_API = "https://api.mfapi.in/mf"

def fetch_historical_nav(scheme_code: int):
    url = f"{MF_API}/{scheme_code}"
    response = requests.get(url, timeout=15)

    if response.status_code != 200:
        return []

    data = response.json()

    # mfapi.in returns { meta, data }
    return data.get("data", [])
