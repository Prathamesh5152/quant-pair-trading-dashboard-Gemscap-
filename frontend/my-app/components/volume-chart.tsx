"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface BarData {
  ts: string
  price: number
  volume: number
}

interface VolumeChartProps {
  bars: BarData[]
}

export function VolumeChart({ bars }: VolumeChartProps) {
  const chartData = bars.slice(-50)

  if (chartData.length === 0) {
    return <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
        <XAxis
          dataKey="ts"
          stroke="#9ca3af"
          fontSize={12}
          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
        />
        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => value.toLocaleString()} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "0.5rem",
          }}
          labelStyle={{ color: "#f9fafb" }}
        />
        <Bar dataKey="volume" fill="#a855f7" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
