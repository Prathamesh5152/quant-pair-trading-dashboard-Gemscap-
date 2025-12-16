import pandas as pd

def resample_ticks(ticks, timeframe="1s"):
    if not ticks:
        return pd.DataFrame()

    df = pd.DataFrame([{
        "ts": t.ts,
        "price": t.price,
        "size": t.size
    } for t in ticks])

    df.set_index("ts", inplace=True)

    bars = df.resample(timeframe).agg({
        "price": "last",
        "size": "sum"
    }).dropna()

    return bars
