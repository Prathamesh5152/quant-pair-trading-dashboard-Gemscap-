from datetime import datetime, timedelta
import uuid

alerts = []

def create_alert(y, x, window, threshold, direction="abs", cooldown=60):
    alert = {
        "id": str(uuid.uuid4()),
        "y": y,
        "x": x,
        "window": window,
        "threshold": threshold,
        "direction": direction,   # above | below | abs
        "cooldown": cooldown,
        "last_triggered": None
    }
    alerts.append(alert)
    return alert

def can_trigger(alert):
    if alert["last_triggered"] is None:
        return True
    return datetime.utcnow() - alert["last_triggered"] > timedelta(seconds=alert["cooldown"])

def check_condition(alert, zscore):
    if alert["direction"] == "above":
        return zscore > alert["threshold"]
    if alert["direction"] == "below":
        return zscore < alert["threshold"]
    return abs(zscore) > alert["threshold"]
