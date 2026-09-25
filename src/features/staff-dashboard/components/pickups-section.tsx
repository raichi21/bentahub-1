"use client"

import { useState } from "react"
import { CheckCircle2, Clock, Trash2 } from "lucide-react"
import { TableSearchInput, TablePagination } from "@/components/data-table"
import { cn } from "@/lib/utils"
import type { PickupItem } from "./payment-pickup-list"

const PICKUPS_PER_PAGE = 10

interface PickupsSectionProps {
  pickups: PickupItem[]
  onCompleteRequest: (item: PickupItem) => void
  onCancelRequest?: (item: PickupItem) => void
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

export function PickupsSection({
  pickups,
  onCompleteRequest,
  onCancelRequest,
}: PickupsSectionProps) {
  const [pickupSearch, setPickupSearch] = useState("")
  const [pickupPage, setPickupPage] = useState(1)

  const filteredPickups = pickups.filter((p) => {
    const q = pickupSearch.toLowerCase()
    return (
      p.id.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    )
  })

  const pickupTotalPages = Math.max(
    1,
    Math.ceil(filteredPickups.length / PICKUPS_PER_PAGE)
  )
  const currentPickupPage = Math.min(pickupPage, pickupTotalPages)
  const paginatedPickups = filteredPickups.slice(
    (currentPickupPage - 1) * PICKUPS_PER_PAGE,
    currentPickupPage * PICKUPS_PER_PAGE
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border bg-muted/20 p-6">
        <TableSearchInput
          placeholder="Search pickups by customer or code..."
          debounceMs={0}
          wrapperClassName="relative w-full"
          onSearch={(q) => {
            setPickupSearch(q)
            setPickupPage(1)
          }}
        />
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Order
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Customer
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Code
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Date
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Status
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-bold tracking-wider uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginatedPickups.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-xs text-muted-foreground"
                >
                  No pickups found
                </td>
              </tr>
            ) : (
              paginatedPickups.map((p, index) => {
                const globalIndex =
                  (currentPickupPage - 1) * PICKUPS_PER_PAGE + index
                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-muted/10"
                  >
                    <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                      ORD-{String(globalIndex + 1).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {p.customerName}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-foreground">
                      {p.code}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                      {new Date(p.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold",
                          p.status === "completed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        )}
                      >
                        {p.status === "completed" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {p.status === "completed" ? "Completed" : "Ready"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === "ready" ? (
                          <button
                            onClick={() => onCompleteRequest(p)}
                            className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/95"
                          >
                            Complete Pickup
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            Done
                          </span>
                        )}
                        {p.status === "ready" &&
                          isOverdue(p.pickupDeadline) &&
                          onCancelRequest && (
                            <button
                              onClick={() => onCancelRequest(p)}
                              className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                              title="Cancel overdue pickup"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredPickups.length > PICKUPS_PER_PAGE && (
        <TablePagination
          page={currentPickupPage}
          pageSize={PICKUPS_PER_PAGE}
          totalCount={filteredPickups.length}
          currentCount={paginatedPickups.length}
          onPageChange={setPickupPage}
          unit="entries"
          variant="compact"
        />
      )}
    </div>
  )
}
