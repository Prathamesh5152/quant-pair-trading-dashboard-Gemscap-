from collections import defaultdict, deque

MAX_TICKS = 10_000
tick_store = defaultdict(lambda: deque(maxlen=MAX_TICKS))

def add_tick(symbol, tick):
    tick_store[symbol].append(tick)

def get_ticks(symbol):
    return list(tick_store[symbol])
