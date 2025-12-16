import { Card } from "@/components/ui/card"
import type { ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: ReactNode
  trend?: number
}

export function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  const getTrendColor = () => {
    if (trend === undefined || trend === null) return "text-muted-foreground"
    if (Math.abs(trend) > 2) return "text-destructive"
    if (Math.abs(trend) > 1) return "text-amber-500"
    return "text-emerald-500"
  }

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-muted-foreground">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className={`text-2xl font-bold tracking-tight ${getTrendColor()}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </Card>
  )
}
