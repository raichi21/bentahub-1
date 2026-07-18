"use client"

import { useState } from "react"
import Link from "next/link"
import { PieChart } from "lucide-react"
import type { PaymentBreakdownData } from "@/types/admin"

interface PaymentBreakdownCardProps {
  data?: PaymentBreakdownData | null
}

export function PaymentBreakdownCard({ data }: PaymentBreakdownCardProps) {
  const [hovered, setHovered] = useState<"cash" | "gcash" | null>(null)

  const isEmpty = !data || (data.cashTotal === 0 && data.gcashTotal === 0)

  const cx = 80
  const cy = 80
  const radius = 35 // centerline radius for stroke-based pie
  const strokeW = 70 // stroke width = full diameter
  const circumference = 2 * Math.PI * radius
  const cashOffset = data ? circumference * (1 - data.cashPercentage / 100) : circumference

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5 min-h-[400px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Payment Method</h2>
            <p className="text-sm text-muted-foreground">Cash vs GCash breakdown</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/payments"
              className="text-[11px] font-semibold text-primary hover:underline tracking-wide"
            >
              View Details
            </Link>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
        </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 flex-1">
          <PieChart className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No payment data available</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 flex-1 justify-center">
          <svg viewBox="0 0 160 160" width="160" height="160" className="w-36 h-36 aspect-square">
            {/* GCash segment (full circle background) */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={strokeW}
              className="transition-opacity duration-200 cursor-pointer"
              style={{ opacity: hovered === "cash" ? 0.35 : 1 }}
              onMouseEnter={() => setHovered("gcash")}
              onMouseLeave={() => setHovered(null)}
            />
            {/* Cash segment (partial overlay, rotated to start at 12 o'clock) */}
            <g transform="rotate(-90 80 80)">
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="#22c55e"
                strokeWidth={strokeW}
                strokeDasharray={circumference}
                strokeDashoffset={cashOffset}
                className="transition-opacity duration-200 cursor-pointer"
                style={{ opacity: hovered === "gcash" ? 0.35 : 1 }}
                onMouseEnter={() => setHovered("cash")}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
            {/* Inner center circle */}
            <circle cx={cx} cy={cy} r={24} fill="var(--card)" className="drop-shadow-sm" />
          </svg>

          <div className="w-full space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                <span className="text-foreground font-medium">Cash</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">{data!.cashTotalDisplay}</span>
                <span className="text-xs font-mono font-bold text-foreground min-w-[3ch] text-right">
                  {data!.cashPercentage}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span className="text-foreground font-medium">GCash</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">{data!.gcashTotalDisplay}</span>
                <span className="text-xs font-mono font-bold text-foreground min-w-[3ch] text-right">
                  {data!.gcashPercentage}%
                </span>
              </div>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Total</span>
              <span className="text-sm font-bold text-foreground">{data!.totalDisplay}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}