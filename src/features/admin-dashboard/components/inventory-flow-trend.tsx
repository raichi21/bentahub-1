"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export function InventoryFlowTrend() {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly">("daily")

  // Height percentages for mockup
  const flowBars = [40, 65, 50, 80, 45, 70, 55, 90]

  return (
    <div className="flex h-[380px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-muted/20 p-6">
        <h4 className="text-lg font-bold text-foreground">
          Inventory Flow Trend
        </h4>
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setTimeframe("daily")}
            className={cn(
              "rounded-md px-4 py-1.5 text-xs font-bold transition-all",
              timeframe === "daily"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeframe("weekly")}
            className={cn(
              "rounded-md px-4 py-1.5 text-xs font-bold transition-all",
              timeframe === "weekly"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Weekly
          </button>
        </div>
      </div>
      <div className="flex h-[280px] flex-1 items-end gap-4 p-6">
        {flowBars.map((height, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-t-lg transition-all duration-500",
              i === flowBars.length - 1
                ? "bg-primary"
                : "bg-primary/20 hover:bg-primary/45"
            )}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  )
}
