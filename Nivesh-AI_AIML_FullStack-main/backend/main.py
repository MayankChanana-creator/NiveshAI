# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from dotenv import load_dotenv
# import os

# from mf_api import router as mf_router
# from stock_api import router as stock_router
# from portfolio_mongodb import router as portfolio_router, init_db
# from crypto_api import router as crypto_router

# # Load environment variables (so MONGODB_URI is available)
# load_dotenv()
# app = FastAPI(title="Combined Stock + Mutual Fund + Crypto API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(mf_router)
# app.include_router(stock_router)
# app.include_router(portfolio_router)
# app.include_router(crypto_router)   
# @app.get("/")
# def root():
#     return {"message": "Stock, Mutual Fund and Crypto unified API is running!"}


# @app.on_event("startup")
# def startup_event():
#     # Attempt to initialize MongoDB connection if MONGODB_URI is set.
#     uri = os.getenv("MONGODB_URI")
#     if uri:
#         init_db(uri)
#     else:
#         # Don't force a connection to localhost if not explicitly configured.
#         # This allows the app to start even when MongoDB is not running.
#         init_db(None)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware



from mf_api import router as mf_router
from stock_api import router as stock_router
from routers.portfolio import router as portfolio_router  # SQLITE
from crypto_api import router as crypto_router
from ai import router as ai
from ai import router as ai_router
from routers.tradeverse import router as tradeverse_router
from routers.goal_planner import router as goal_planner_router
from routers.simulator_api import router as simulator_router
from routers.historical_replay import router as replay_router
from routers.ai_agent import router as ai_agent_router
from routers.wealth_pilot import router as wealth_pilot_router




app = FastAPI(title="Combined Stock + Mutual Fund + Crypto API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(mf_router)
app.include_router(stock_router)
app.include_router(portfolio_router)
app.include_router(crypto_router)
app.include_router(ai)
app.include_router(ai_router)
app.include_router(tradeverse_router)
app.include_router(goal_planner_router)
app.include_router(simulator_router)
app.include_router(replay_router)
app.include_router(ai_agent_router)
app.include_router(wealth_pilot_router)

@app.get("/")
def root():
    return {"message": "Stock, Mutual Fund and Crypto unified API is running!"}
