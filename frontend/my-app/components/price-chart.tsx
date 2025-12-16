"use client"

import { useMemo } from "react"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface BarData {
  ts: string
  price: number
  volume: number
}

interface PriceChartProps {
  barsY: BarData[]
  barsX: BarData[]
  symbolY: string
  symbolX: string
}

export function PriceChart({
  barsY,
  barsX,
  symbolY,
  symbolX,
}: PriceChartProps) {
  const chartData = useMemo(() => {
    if (!barsY.length || !barsX.length) return []

    const baseY = barsY[0].price
    const baseX = barsX[0].price

    const map = new Map<string, any>()

    barsY.forEach((b) => {
      map.set(b.ts, {
        ts: b.ts,
        y: (b.price / baseY) * 100,
      })
    })

    barsX.forEach((b) => {
      const row = map.get(b.ts)
      if (row) {
        row.x = (b.price / baseX) * 100
      }
    })

    return Array.from(map.values())
      .filter((r) => r.y !== undefined && r.x !== undefined)
      .slice(-100)
  }, [barsY, barsX])

  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        Waiting for data…
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.4} />

        <XAxis
          dataKey="ts"
          tickFormatter={(v) => new Date(v).toLocaleTimeString()}
          stroke="#9ca3af"
        />

        <YAxis
          stroke="#9ca3af"
          tickFormatter={(v) => `${v.toFixed(1)}`}
          domain={["auto", "auto"]}
        />

        <Tooltip
          formatter={(v: number) => `${v.toFixed(2)}`}
          labelFormatter={(l) => new Date(l).toLocaleTimeString()}
          contentStyle={{
            backgroundColor: "#111827",
            border: "1px solid #374151",
            borderRadius: "0.5rem",
          }}
        />

        <Legend />

        <Line
          type="monotone"
          dataKey="y"
          stroke="#06b6d4"
          strokeWidth={2}
          dot={false}
          name={`${symbolY.toUpperCase()} (Normalized)`}
        />

        <Line
          type="monotone"
          dataKey="x"
          stroke="#84cc16"
          strokeWidth={2}
          dot={false}
          name={`${symbolX.toUpperCase()} (Normalized)`}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
