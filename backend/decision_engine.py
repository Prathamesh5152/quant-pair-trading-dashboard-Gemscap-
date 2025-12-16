def trader_decision(
    zscore: float | None,
    correlation: float | None,
    volume_pct: float | None = 0.5
):
    """
    Rule-based, explainable trader decision engine
    """

    # Safe defaults
    if zscore is None or correlation is None:
        return {
            "market_bias": "Neutral",
            "trade_signal": "HOLD",
            "confidence": 20,
            "reasons": ["Insufficient data"]
        }

    reasons = []
    confidence = 0

    # 1. Correlation filter
    if correlation < 0.4:
        return {
            "market_bias": "Neutral",
            "trade_signal": "HOLD",
            "confidence": 25,
            "reasons": ["Low correlation – unreliable pair"]
        }

    # 2. Z-score logic
    if zscore > 2:
        market_bias = "Bearish"
        trade_signal = "SELL"
        reasons.append("Z-score > +2 (spread overextended)")
        confidence += min(60, abs(zscore) * 30)

    elif zscore < -2:
        market_bias = "Bullish"
        trade_signal = "BUY"
        reasons.append("Z-score < -2 (spread overextended)")
        confidence += min(60, abs(zscore) * 30)

    else:
        market_bias = "Neutral"
        trade_signal = "HOLD"
        reasons.append("Z-score within normal range")

    # 3. Correlation contribution
    confidence += correlation * 30
    reasons.append(f"Rolling correlation = {correlation:.2f}")

    # 4. Volume contribution (optional but useful)
    confidence += volume_pct * 40
    reasons.append("Sufficient liquidity")

    return {
        "market_bias": market_bias,
        "trade_signal": trade_signal,
        "confidence": int(min(100, confidence)),
        "reasons": reasons
    }
