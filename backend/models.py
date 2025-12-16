from dataclasses import dataclass
from datetime import datetime

@dataclass
class Tick:
    symbol: str
    ts: datetime
    price: float
    size: float
