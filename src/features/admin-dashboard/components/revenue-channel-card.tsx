"use client"

import { useState } from "react"
import { Store } from "lucide-react"
import type { AdminOverviewData } from "@/types/admin"

type RevenueChannels = AdminOverviewData["revenueChannels"]

interface RevenueChannelCardProps {
  data?: RevenueChannels | null
}

export function RevenueChannelCard({ data }: RevenueChannelCardProps) {
  const [hovered, setHovered] = useState<"walkin" | "pickup" | null>(null)

  const isEmpty = !data || (data.pos === 0 && data.reservations === 0)

  const cx = 80
  const cy = 80
  const radius = 35
  const strokeW = 70
  const circumference = 2 * Math.PI * radius
  const walkinOffset = data
    ? circumference * (1 - data.posPercentage / 100)
    : circumference

  return (
    <div className="flex min-h-[400px] flex-col gap-5 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Revenue Channel</h2>
          <p className="text-sm text-muted-foreground">
            Walk-in vs Pickup breakdown
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Store className="h-5 w-5" />
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <Store className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            No revenue data available
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-5">
          <svg
            viewBox="0 0 160 160"
            width="160"
            height="160"
            className="aspect-square h-36 w-36"
          >
            {/* Pickup segment (full circle background) */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={strokeW}
              className="cursor-pointer transition-opacity duration-200"
              style={{ opacity: hovered === "walkin" ? 0.35 : 1 }}
              onMouseEnter={() => setHovered("pickup")}
              onMouseLeave={() => setHovered(null)}
            />
            {/* Walk-in segment (partial overlay, rotated to start at 12 o'clock) */}
            <g transform="rotate(-90 80 80)">
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="#22c55e"
                strokeWidth={strokeW}
                strokeDasharray={circumference}
                strokeDashoffset={walkinOffset}
                className="cursor-pointer transition-opacity duration-200"
                style={{ opacity: hovered === "pickup" ? 0.35 : 1 }}
                onMouseEnter={() => setHovered("walkin")}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
            {/* Inner center circle */}
            <circle
              cx={cx}
              cy={cy}
              r={24}
              fill="var(--card)"
              className="drop-shadow-sm"
            />
          </svg>

          <div className="w-full space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full bg-green-500" />
                <span className="font-medium text-foreground">Walk-in</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-foreground">
                  {data!.posDisplay}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full bg-blue-500" />
                <span className="font-medium text-foreground">Pickup</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-foreground">
                  {data!.reservationsDisplay}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm font-medium text-muted-foreground">
                Total
              </span>
              <span className="text-xl font-bold text-foreground">
                {data!.totalDisplay}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
