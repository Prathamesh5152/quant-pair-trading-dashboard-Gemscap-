# 📊 Quant Pair Trading Analytics Dashboard

A **real-time quantitative analytics platform** designed to monitor and analyze **pair trading opportunities** using statistical arbitrage concepts.  
The system ingests live crypto market data, performs rolling quantitative analytics, generates **trader-friendly signals (BUY / SELL / HOLD)**, and visualizes insights via an interactive dashboard.

---

## 🚀 Key Features

### 🔁 Real-Time Market Ingestion
- Live **Binance WebSocket** tick data
- Historical OHLC ingestion (CSV / REST)
- Timestamp normalization and symbol-wise routing

### ⚡ Storage Layer
- **In-memory ring buffers (deque)** for low-latency analytics
- **SQLite persistence** for historical analysis
- Multi-timeframe resampling (1s, 1m, 5m)

### 📐 Quant Analytics Engine
- Hedge ratio estimation (OLS regression)
- Spread computation
- Rolling Z-score
- Rolling correlation
- ADF stationarity test
- Mean-reversion regime filters
- Rule-based alert engine
- Trader decision engine with:
  - Market Bias: *Bullish / Bearish / Neutral*
  - Trade Signal: *BUY / SELL / HOLD*
  - Confidence score and explainable reasons

### 🌐 API Layer (FastAPI)
- `/bars` – OHLC data
- `/pair` – real-time pair analytics + decision signal
- `/pair_series` – spread & z-score time series
- `/alerts` – alert management
- `/export` – CSV export

### 🖥️ Frontend Dashboard (Next.js)
- Normalized dual-asset price charts
- Spread and Z-score visualizations with bands
- Real-time analytics cards
- Alert creation and monitoring panel
- CSV export for trader workflows

---

## 🏗️ System Architecture

<img width="3172" height="1135" alt="diagram-export-12-17-2025-12_05_52-AM" src="https://github.com/user-attachments/assets/d193a5f7-b820-4227-802e-2f4bec849fea" />



---

## 🧠 Trader Decision Logic (Example)

| Condition | Signal |
|---------|--------|
| Z-Score > +2 and Stationary | SELL |
| Z-Score < −2 and Stationary | BUY |
| Non-stationary / Insufficient Data | HOLD |
| Low Correlation | NEUTRAL |

Each signal includes:
- Confidence score
- Market bias
- Explainable reasons

---

## 🛠️ Tech Stack

**Backend**
- Python
- FastAPI
- Pandas, NumPy, Statsmodels
- SQLite
- WebSockets (Async IO)

**Frontend**
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- shadcn/ui

---

## ▶️ Run the Entire System (Single Command)

The frontend and backend can be started together using **one command**.

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+
- `concurrently` installed (already included in `package.json`)

### One-Command Startup

From the **project root**:

```bash
npm run dev


