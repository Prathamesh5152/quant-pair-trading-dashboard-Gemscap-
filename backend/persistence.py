import sqlite3
from pathlib import Path

DB_PATH = Path("market_data.db")

def get_conn():
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS bars (
        ts TEXT,
        symbol TEXT,
        timeframe TEXT,
        price REAL,
        volume REAL,
        PRIMARY KEY (ts, symbol, timeframe)
    )
    """)

    conn.commit()
    conn.close()
def insert_bars(df, symbol, timeframe):
    if df.empty:
        return

    conn = get_conn()
    cur = conn.cursor()

    for ts, row in df.iterrows():
        cur.execute("""
        INSERT OR REPLACE INTO bars
        (ts, symbol, timeframe, price, volume)
        VALUES (?, ?, ?, ?, ?)
        """, (
            ts.isoformat(),
            symbol,
            timeframe,
            float(row["price"]),
            float(row["size"])
        ))

    conn.commit()
    conn.close()
