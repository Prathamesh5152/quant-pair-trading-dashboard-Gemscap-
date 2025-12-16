"use client"

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

interface SeriesData {
  ts?: string[]
  zscore?: number[]
}

interface ZScoreChartProps {
  data?: SeriesData
}

export function ZScoreChart({ data }: ZScoreChartProps) {
  // -----------------------------
  // Defensive guards
  // -----------------------------
  if (
    !data ||
    !Array.isArray(data.ts) ||
    !Array.isArray(data.zscore) ||
    data.ts.length === 0
  ) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Waiting for z-score data…
      </div>
    )
  }

  // -----------------------------
  // Build chart data safely
  // -----------------------------
  const chartData = data.ts
    .map((ts, i) => ({
      ts,
      zscore: data.zscore![i],
    }))
    .filter((d) => Number.isFinite(d.zscore)) // 🔥 removes null / NaN
    .slice(-100)

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No valid z-score data
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

        {/* Mean-reversion bands */}
        <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="3 3" />
        <ReferenceLine y={-2} stroke="#ef4444" strokeDasharray="3 3" />
        <ReferenceLine y={0} stroke="#6b7280" opacity={0.5} />

        <Line
          type="monotone"
          dataKey="zscore"
          stroke="#ec4899"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
