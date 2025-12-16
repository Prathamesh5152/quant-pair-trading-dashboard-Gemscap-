import asyncio
from store import get_ticks
from sampler import resample_ticks
from persistence import insert_bars

TIMEFRAMES = {
    "1s": "1s",
    "1m": "1min",
    "5m": "5min"
}

async def resample_loop(symbols):
    while True:
        for symbol in symbols:
            ticks = get_ticks(symbol)

            for tf_name, tf in TIMEFRAMES.items():
                bars = resample_ticks(ticks, tf)
                insert_bars(bars.tail(1), symbol, tf_name)

        await asyncio.sleep(1)
