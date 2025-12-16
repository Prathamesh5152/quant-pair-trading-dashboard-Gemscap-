import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller

# -----------------------------
# Basic statistics
# -----------------------------
def price_stats(series: pd.Series):
    returns = series.pct_change().dropna()
    return {
        "last_price": float(series.iloc[-1]),
        "mean_return": float(returns.mean()) if not returns.empty else None,
        "volatility": float(returns.std()) if not returns.empty else None,
        "min_price": float(series.min()),
        "max_price": float(series.max())
    }


# -----------------------------
# Z-score
# -----------------------------
def zscore(series: pd.Series, window: int):
    mean = series.rolling(window).mean()
    std = series.rolling(window).std()
    return (series - mean) / std


# -----------------------------
# OLS Hedge Ratio
# -----------------------------
def hedge_ratio_ols(y: pd.Series, x: pd.Series) -> float:
    x_ = sm.add_constant(x)
    model = sm.OLS(y, x_).fit()
    return model.params[1]


# -----------------------------
# Spread
# -----------------------------
def spread_series(y: pd.Series, x: pd.Series, beta: float):
    return y - beta * x


# -----------------------------
# Rolling correlation
# -----------------------------
def rolling_corr(y: pd.Series, x: pd.Series, window: int):
    return y.rolling(window).corr(x)


# -----------------------------
# ADF Test (Stationarity)
# -----------------------------
def adf_test(series):
    series = series.dropna()

    if len(series) < 20:
        return {
            "adf_stat": None,
            "p_value": None,
            "stationary": None
        }

    from statsmodels.tsa.stattools import adfuller
    result = adfuller(series)

    p_value = float(result[1])
    stationary = bool(p_value < 0.05)  # 🔑 CAST TO PYTHON BOOL

    return {
        "adf_stat": float(result[0]),
        "p_value": p_value,
        "stationary": stationary
    }
