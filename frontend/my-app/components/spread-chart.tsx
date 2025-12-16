"use client"

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface SeriesData {
  ts?: string[]
  spread?: number[]
}

interface SpreadChartProps {
  data?: SeriesData
}

export function SpreadChart({ data }: SpreadChartProps) {
  // -----------------------------
  // Defensive guards (IMPORTANT)
  // -----------------------------
  if (
    !data ||
    !Array.isArray(data.ts) ||
    !Array.isArray(data.spread) ||
    data.ts.length === 0
  ) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Waiting for spread data…
      </div>
    )
  }

  // -----------------------------
  // Build chart data safely
  // -----------------------------
  const chartData = data.ts
    .map((ts, i) => ({
      ts,
      spread: data.spread![i],
    }))
    .filter((d) => Number.isFinite(d.spread)) // 🔥 avoid NaN / null
    .slice(-100)

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No valid spread data
      </div>
    )
  }

  // -----------------------------
  // Render chart
  // -----------------------------
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />

        <XAxis
          dataKey="ts"
          stroke="#9ca3af"
          fontSize={12}
          tickFormatter={(value) =>
            new Date(value).toLocaleTimeString()
          }
        />

        <YAxis stroke="#9ca3af" fontSize={12} />

        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "0.5rem",
          }}
          labelStyle={{ color: "#f9fafb" }}
        />

        <Line
          type="monotone"
          dataKey="spread"
          stroke="#fb923c"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
