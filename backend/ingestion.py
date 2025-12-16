import json
import asyncio
import websockets
from datetime import datetime
from dataclasses import dataclass

from store import add_tick

BINANCE_WS = "wss://stream.binance.com:9443/ws"

@dataclass
class Tick:
    ts: datetime
    symbol: str
    price: float
    size: float

async def stream_symbol(symbol: str):
    url = f"{BINANCE_WS}/{symbol}@trade"
    print(f"Connecting to {symbol}")

    async with websockets.connect(url) as ws:
        async for msg in ws:
            data = json.loads(msg)

            tick = Tick(
                ts=datetime.fromtimestamp(data["T"] / 1000),
                symbol=symbol,
                price=float(data["p"]),
                size=float(data["q"])
            )

            # 🔑 STORE TICK (THIS MUST HAPPEN)
            add_tick(symbol, tick)

async def start_ingestion(symbols):
    tasks = []
    for s in symbols:
        tasks.append(asyncio.create_task(stream_symbol(s)))

    await asyncio.gather(*tasks)
