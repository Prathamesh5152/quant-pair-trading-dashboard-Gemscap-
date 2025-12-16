"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Alert {
  id?: string
  y?: string
  x?: string
  window?: number
  threshold?: number
  direction?: string
  cooldown?: number
  last_triggered?: string | null
}

interface AlertsTableProps {
  alerts: Alert[]
}

export function AlertsTable({ alerts }: AlertsTableProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No active alerts
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset Y</TableHead>
          <TableHead>Asset X</TableHead>
          <TableHead>Window</TableHead>
          <TableHead>Threshold</TableHead>
          <TableHead>Last Triggered</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {alerts.map((alert, idx) => (
          <TableRow
            key={
              alert.id ??
              `${alert.y}-${alert.x}-${alert.window}-${alert.threshold}-${idx}`
            }
          >
            <TableCell className="font-medium">
              {(alert.y ?? "—").toUpperCase()}
            </TableCell>

            <TableCell>
              {(alert.x ?? "—").toUpperCase()}
            </TableCell>

            <TableCell>
              {alert.window ?? "—"}
            </TableCell>

            <TableCell>
              {alert.threshold ?? "—"}
            </TableCell>

            <TableCell className="text-muted-foreground">
              {alert.last_triggered
                ? new Date(alert.last_triggered).toLocaleString()
                : "Never"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
