  "use client"

  import { useState, useEffect } from "react"
  import { Card } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { Input } from "@/components/ui/input"
  import { Badge } from "@/components/ui/badge"
  import { Slider } from "@/components/ui/slider"
  import { PriceChart } from "@/components/price-chart"
  import { VolumeChart } from "@/components/volume-chart"
  import { SpreadChart } from "@/components/spread-chart"
  import { ZScoreChart } from "@/components/zscore-chart"
  import { MetricCard } from "@/components/metric-card"
  import { AlertsTable } from "@/components/alerts-table"
  import { TrendingUp, TrendingDown, Activity, BarChart3, Zap } from "lucide-react"

  const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

  interface BarData {
    ts: string
    price: number
    volume: number
  }

  interface PairData {
    hedge_ratio?: number
    latest_spread?: number
    spread_zscore?: number
    rolling_correlation?: number
    adf_test?: {
      p_value: number
      stationary: boolean
    }
    decision?: {
      market_bias: string
      trade_signal: string
      confidence: number
      reasons: string[]
    }
  }


  interface SeriesData {
    ts: string[]
    spread: number[]
    zscore: number[]
  }

  interface Alert {
    id: string
    y: string
    x: string
    window: number
    threshold: number
    created_at: string
  }

  export default function Dashboard() {
    const [symbolY, setSymbolY] = useState("ethusdt")
    const [symbolX, setSymbolX] = useState("btcusdt")
    const [window, setWindow] = useState(200)
    const [timeframe, setTimeframe] = useState("1m")
    const [threshold, setThreshold] = useState(1.5)

    const [barsY, setBarsY] = useState<BarData[]>([])
    const [barsX, setBarsX] = useState<BarData[]>([])
    const [pairData, setPairData] = useState<PairData>({})
    const [seriesData, setSeriesData] = useState<SeriesData>({ ts: [], spread: [], zscore: [] })
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
      fetchData()
      const interval = setInterval(fetchData, 5000)
      return () => clearInterval(interval)
    }, [symbolY, symbolX, window, timeframe])

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [barsYRes, barsXRes, pairRes, seriesRes, alertsRes] = await Promise.all([
          fetch(`${BACKEND}/bars?symbol=${symbolY}&timeframe=${timeframe}`).then((r) => r.json()),
          fetch(`${BACKEND}/bars?symbol=${symbolX}&timeframe=${timeframe}`).then((r) => r.json()),
          fetch(`${BACKEND}/pair?y=${symbolY}&x=${symbolX}&window=${window}`).then((r) => r.json()),
          fetch(`${BACKEND}/pair_series?y=${symbolY}&x=${symbolX}&window=${window}`).then((r) => r.json()),
          fetch(`${BACKEND}/alerts`).then((r) => r.json()),
        ])

        setBarsY(Array.isArray(barsYRes) ? barsYRes : [])
        setBarsX(Array.isArray(barsXRes) ? barsXRes : [])
        setPairData(pairRes || {})
        setSeriesData(seriesRes || { ts: [], spread: [], zscore: [] })
        setAlerts(Array.isArray(alertsRes) ? alertsRes : [])
      } catch (error) {
        console.error("Error fetching data from backend:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const createAlert = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${BACKEND}/alerts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            y: symbolY,
            x: symbolX,
            window,
            threshold,
          }),
        })

        if (response.ok) {
          const newAlert = await response.json()
          setAlerts([...alerts, newAlert])
        }
      } catch (error) {
        console.error("Error creating alert:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const fmt = (value: number | undefined | null, decimals = 2) => {
      if (value === null || value === undefined) return "N/A"
      return value.toFixed(decimals)
    }

    const currentPriceY = barsY.length > 0 ? barsY[barsY.length - 1].price : 0
    const currentPriceX = barsX.length > 0 ? barsX[barsX.length - 1].price : 0
    const priceChangeY =
      barsY.length > 1
        ? ((barsY[barsY.length - 1].price - barsY[barsY.length - 2].price) / barsY[barsY.length - 2].price) * 100
        : 0
    const priceChangeX =
      barsX.length > 1
        ? ((barsX[barsX.length - 1].price - barsX[barsX.length - 2].price) / barsX[barsX.length - 2].price) * 100
        : 0

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Activity className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Quant Analytics</h1>
                  <p className="text-xs text-muted-foreground">Real-Time Trading Dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          {/* Controls */}
          <Card className="mb-6 p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Asset Y</label>
                <Select value={symbolY} onValueChange={setSymbolY}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="btcusdt">BTCUSDT</SelectItem>
                    <SelectItem value="ethusdt">ETHUSDT</SelectItem>
                    <SelectItem value="solusdt">SOLUSDT</SelectItem>
                    <SelectItem value="avaxusdt">AVAXUSDT</SelectItem>
                    <SelectItem value="maticusdt">MATICUSDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Asset X</label>
                <Select value={symbolX} onValueChange={setSymbolX}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="btcusdt">BTCUSDT</SelectItem>
                    <SelectItem value="ethusdt">ETHUSDT</SelectItem>
                    <SelectItem value="solusdt">SOLUSDT</SelectItem>
                    <SelectItem value="avaxusdt">AVAXUSDT</SelectItem>
                    <SelectItem value="maticusdt">MATICUSDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Timeframe</label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1s">1 Second</SelectItem>
                    <SelectItem value="1m">1 Minute</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Window: {window}</label>
                <Slider
                  value={[window]}
                  onValueChange={(v) => setWindow(v[0])}
                  min={50}
                  max={500}
                  step={50}
                  className="mt-2"
                />
              </div>
            </div>
          </Card>

          {/* Current Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{symbolY.toUpperCase()}</p>
                  <h3 className="text-3xl font-bold tracking-tight">${currentPriceY.toFixed(2)}</h3>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${priceChangeY >= 0 ? "text-emerald-500" : "text-red-500"}`}
                >
                  {priceChangeY >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(priceChangeY).toFixed(2)}%
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{symbolX.toUpperCase()}</p>
                  <h3 className="text-3xl font-bold tracking-tight">${currentPriceX.toFixed(2)}</h3>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${priceChangeX >= 0 ? "text-emerald-500" : "text-red-500"}`}
                >
                  {priceChangeX >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(priceChangeX).toFixed(2)}%
                </div>
              </div>
            </Card>
          </div>

          {/* Price Chart */}
          <Card className="mb-6 p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Price Chart</h2>
            </div>
            <PriceChart barsY={barsY} barsX={barsX} symbolY={symbolY} symbolX={symbolX} />
          </Card>

          {/* Volume Chart */}
          <Card className="mb-6 p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Volume</h2>
            </div>
            <VolumeChart bars={barsY} />
          </Card>
{/* Pair Analytics */}
<div className="mb-6">
  <div className="flex items-center gap-2 mb-4">
    <Zap className="h-5 w-5 text-muted-foreground" />
    <h2 className="text-lg font-semibold">Pair Trading Analytics</h2>
  </div>

  {/* Quant Metrics */}
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
    <MetricCard
      title="Hedge Ratio"
      value={fmt(pairData.hedge_ratio, 3)}
      icon={<TrendingUp className="h-4 w-4" />}
    />

    <MetricCard
      title="Spread"
      value={fmt(pairData.latest_spread, 2)}
      icon={<Activity className="h-4 w-4" />}
    />

    <MetricCard
      title="Z-Score"
      value={fmt(pairData.spread_zscore, 2)}
      icon={<BarChart3 className="h-4 w-4" />}
      trend={pairData.spread_zscore}
    />

    <MetricCard
      title="Correlation"
      value={fmt(pairData.rolling_correlation, 2)}
      icon={<Activity className="h-4 w-4" />}
    />

    <MetricCard
      title="ADF p-value"
      value={fmt(pairData.adf_test?.p_value, 4)}
      subtitle={
        pairData.adf_test?.stationary === null
          ? "N/A"
          : pairData.adf_test?.stationary
          ? "Stationary"
          : "Non-stationary"
      }
      icon={<Zap className="h-4 w-4" />}
    />
  </div>

  {/* 🔥 Trader Decision Panel */}
  {pairData.decision && (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Market Bias */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground mb-1">Market Bias</p>
        <h3
          className={`text-xl font-bold ${
            pairData.decision.market_bias === "Bullish"
              ? "text-emerald-500"
              : pairData.decision.market_bias === "Bearish"
              ? "text-red-500"
              : "text-gray-400"
          }`}
        >
          {pairData.decision.market_bias}
        </h3>
      </Card>

      {/* Trade Signal */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground mb-1">Trade Signal</p>
        <h3
          className={`text-xl font-bold ${
            pairData.decision.trade_signal === "BUY"
              ? "text-emerald-500"
              : pairData.decision.trade_signal === "SELL"
              ? "text-red-500"
              : "text-gray-400"
          }`}
        >
          {pairData.decision.trade_signal}
        </h3>
      </Card>

      {/* Confidence */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground mb-1">Confidence</p>
        <h3 className="text-xl font-bold">
          {pairData.decision.confidence}%
        </h3>
      </Card>

      {/* Reasoning */}
      <Card className="p-4 md:col-span-1">
        <p className="text-xs text-muted-foreground mb-2">Reasoning</p>
        <ul className="text-sm list-disc pl-4 space-y-1">
          {pairData.decision.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </Card>
    </div>
  )}
</div>

          {/* Spread & Z-Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <h2 className="text-lg font-semibold mb-4">Spread Time Series</h2>
              <SpreadChart data={seriesData} />
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <h2 className="text-lg font-semibold mb-4">Z-Score with Bands</h2>
              <ZScoreChart data={seriesData} />
            </Card>
          </div>

          {/* Alert Engine */}
          <Card className="mb-6 p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <h2 className="text-lg font-semibold mb-4">Alert Engine</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Z-Score Threshold</label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number.parseFloat(e.target.value))}
                  step="0.1"
                  className="bg-background"
                />
              </div>
              <Button onClick={createAlert} disabled={isLoading} className="gap-2">
                <Zap className="h-4 w-4" />
                {isLoading ? "Creating..." : "Create Alert"}
              </Button>
            </div>
          </Card>

          {/* Active Alerts */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <h2 className="text-lg font-semibold mb-4">Active Alerts</h2>
            <AlertsTable alerts={alerts} />
          </Card>

          {/* CSV Export */}
<Card className="mt-6 p-6 bg-card/50 backdrop-blur-sm border-border/50">
  <div className="mb-3">
    <h2 className="text-lg font-semibold">Export Market Data</h2>
    <p className="text-sm text-muted-foreground">
      Download OHLCV data for offline analysis
    </p>
  </div>

  <div className="flex gap-3">
    {/* Export Asset Y */}
    <a
      href={`${BACKEND}/export?symbol=${symbolY}&timeframe=${timeframe}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button variant="outline">
        ⬇️ {symbolY.toUpperCase()} CSV
      </Button>
    </a>

    {/* Export Asset X */}
    <a
      href={`${BACKEND}/export?symbol=${symbolX}&timeframe=${timeframe}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button variant="outline">
        ⬇️ {symbolX.toUpperCase()} CSV
      </Button>
    </a>
  </div>
</Card>

        </div>
      </div>
    )
  }
