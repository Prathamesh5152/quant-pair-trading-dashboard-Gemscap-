import asyncio
from datetime import datetime
import pandas as pd

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import io
import csv

from ingestion import start_ingestion
from store import get_ticks
from analytics import (
    zscore,
    hedge_ratio_ols,
    spread_series,
    rolling_corr,
    adf_test,
    price_stats
)
from alerts import (
    alerts,
    create_alert,
    can_trigger,
    check_condition
)
from persistence import init_db, get_conn
from resample_task import resample_loop
import math
from decision_engine import trader_decision


from fastapi.middleware.cors import CORSMiddleware



def safe_float(x):
    if x is None:
        return None
    if isinstance(x, float) and (math.isnan(x) or math.isinf(x)):
        return None
    return float(x)


def safe_list(values):
    out = []
    for v in values:
        if v is None:
            out.append(None)
        elif isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            out.append(None)
        else:
            out.append(float(v))
    return out

# -----------------------------
# App setup
# -----------------------------
app = FastAPI()
SYMBOLS = ["btcusdt", "ethusdt"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Startup (SINGLE EVENT LOOP)
# -----------------------------
@app.on_event("startup")
async def startup():
    init_db()

    # Start ingestion + resampling as background tasks
    asyncio.create_task(start_ingestion(SYMBOLS))
    asyncio.create_task(resample_loop(SYMBOLS))

    print(" Ingestion + persistence started")

# -----------------------------
# Helpers
# -----------------------------
import pandas as pd

def normalize_ticks(ticks):
    rows = []

    for t in ticks:
        if isinstance(t, dict):
            ts = t.get("ts")
            price = t.get("price")
        else:
            ts = getattr(t, "ts", None)
            price = getattr(t, "price", None)

        if ts is None or price is None:
            continue

        rows.append({
            "ts": pd.to_datetime(ts),
            "price": float(price)
        })

    if not rows:
        return pd.DataFrame(columns=["price"])

    return pd.DataFrame(rows).set_index("ts")


def align_ticks(ticks_y, ticks_x, freq="1s"):
    df_y = normalize_ticks(ticks_y)
    df_x = normalize_ticks(ticks_x)

    if df_y.empty or df_x.empty:
        return pd.DataFrame()

    df_y = (
        df_y
        .resample(freq)
        .last()
        .rename(columns={"price": "price_y"})
    )

    df_x = (
        df_x
        .resample(freq)
        .last()
        .rename(columns={"price": "price_x"})
    )

    return df_y.join(df_x, how="inner").dropna()

# -----------------------------
# APIs
# -----------------------------
@app.get("/ticks/{symbol}")
def ticks(symbol: str):
    return [
        {"ts": t.ts, "price": t.price, "size": t.size}
        for t in get_ticks(symbol)
    ]

@app.get("/zscore/{symbol}")
def zscore_api(symbol: str, window: int = 100):
    ticks = get_ticks(symbol)

    if len(ticks) < window:
        return {"status": "waiting_for_data", "ticks": len(ticks)}

    df = pd.DataFrame(
        [{"ts": t.ts, "price": t.price} for t in ticks]
    ).set_index("ts")

    z = zscore(df["price"], window).dropna()
    if z.empty:
        return {"status": "insufficient_data"}

    return {
        "symbol": symbol,
        "window": window,
        "zscore": float(z.iloc[-1])
    }

# -----------------------------
# Pair Trading API
# -----------------------------
@app.get("/pair")
def pair_trade(y: str, x: str, window: int = 300):
    ticks_y = get_ticks(y)
    ticks_x = get_ticks(x)

    df = align_ticks(ticks_y, ticks_x)

    if len(df) < window:
        return {
            "status": "waiting_for_data",
            "aligned_points": len(df),
            "required": window
        }

    df = df.tail(window)

    beta = hedge_ratio_ols(df["price_y"], df["price_x"])
    spread = spread_series(df["price_y"], df["price_x"], beta)

    z_series = zscore(spread, window).dropna()
    spread_z = float(z_series.iloc[-1]) if not z_series.empty else None

    adf_result = adf_test(spread)

    ret_y = df["price_y"].pct_change()
    ret_x = df["price_x"].pct_change()
    corr_series = ret_y.rolling(window).corr(ret_x).dropna()
    corr_value = float(corr_series.iloc[-1]) if not corr_series.empty else None

    triggered_alerts = []
    if spread_z is not None:
        for alert in alerts:
            if alert["y"] == y and alert["x"] == x and alert["window"] == window:
                if check_condition(alert, spread_z) and can_trigger(alert):
                    alert["last_triggered"] = datetime.utcnow()
                    triggered_alerts.append({
                        "alert_id": alert["id"],
                        "message": f"Z-score {spread_z:.2f} breached {alert['threshold']}"
                    })

    decision = trader_decision(
    zscore=spread_z,
    correlation=corr_value,
    volume_pct=0.7  # simple constant for now
)

    return {
    "y": y,
    "x": x,
    "window": window,
    "hedge_ratio": float(beta),
    "latest_spread": float(spread.iloc[-1]),
    "spread_zscore": spread_z,
    "rolling_correlation": corr_value,
    "adf_test": adf_result,
    "decision": decision
}



# -----------------------------
# Pair Time Series
# -----------------------------
@app.get("/pair_series")
def pair_series(y: str, x: str, window: int = 300):
    df = align_ticks(get_ticks(y), get_ticks(x))

    if len(df) < window:
        return {"status": "waiting_for_data"}

    df = df.tail(window)

    beta = hedge_ratio_ols(df["price_y"], df["price_x"])
    spread = spread_series(df["price_y"], df["price_x"], beta)
    z = zscore(spread, window)

    return {
        "ts": df.index.astype(str).tolist(),
        "spread": safe_list(spread.tolist()),
        "zscore": safe_list(z.tolist())
    }


# -----------------------------
# Alerts
# -----------------------------
class AlertRequest(BaseModel):
    y: str
    x: str
    window: int
    threshold: float
    direction: str = "abs"
    cooldown: int = 60

@app.post("/alerts")
def add_alert(req: AlertRequest):
    return {
        "status": "created",
        "alert": create_alert(
            req.y, req.x, req.window,
            req.threshold, req.direction, req.cooldown
        )
    }

@app.get("/alerts")
def list_alerts():
    return alerts

# -----------------------------
# Bars / Export
# -----------------------------
@app.get("/bars")
def get_bars(symbol: str, timeframe: str = "1m", limit: int = 500):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT ts, price, volume
        FROM bars
        WHERE symbol = ? AND timeframe = ?
        ORDER BY ts DESC
        LIMIT ?
    """, (symbol, timeframe, limit))
    rows = cur.fetchall()
    conn.close()

    return [
        {"ts": ts, "price": price, "volume": volume}
        for ts, price, volume in reversed(rows)
    ]

@app.get("/export")
def export_csv(symbol: str, timeframe: str = "1m"):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT ts, price, volume
        FROM bars
        WHERE symbol = ? AND timeframe = ?
        ORDER BY ts
    """, (symbol, timeframe))
    rows = cur.fetchall()
    conn.close()

    def stream():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["ts", "price", "volume"])
        writer.writerows(rows)
        buffer.seek(0)
        yield buffer.read()

    return StreamingResponse(
        stream(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={symbol}_{timeframe}.csv"
        }
    )

# -----------------------------
# Price Stats
# -----------------------------
@app.get("/stats/{symbol}")
def stats_api(symbol: str, window: int = 300):
    ticks = get_ticks(symbol)
    if len(ticks) < window:
        return {"status": "waiting_for_data"}

    df = pd.DataFrame(
        [{"ts": t.ts, "price": t.price} for t in ticks]
    ).set_index("ts").tail(window)

    return price_stats(df["price"])
