"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Store, Loader2 } from "lucide-react"

interface BranchData {
  id: string
  name: string
  location: string
  capacity: number
}

export function NearbyBranches() {
  const router = useRouter()
  const [branches, setBranches] = useState<BranchData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setBranches(json.data)
        }
      })
      .catch((err) => console.error("Failed to fetch branches:", err))
      .finally(() => setIsLoading(false))
  }, [])

  const isOpen = () => {
    const now = new Date()
    const hour = now.getHours()
    return hour >= 8 && hour < 17
  }

  const openNow = isOpen()

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border p-4 md:p-6">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold">Nearby Branches</h2>
        </div>
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (branches.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border p-4 md:p-6">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold">Nearby Branches</h2>
        </div>
        <div className="p-6 text-center text-sm text-muted-foreground">
          No branches available.
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border p-4 md:p-6">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-lg font-bold">Nearby Branches</h2>
      </div>

      {/* Branch List */}
      <div className="divide-y divide-border">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() =>
              router.push(
                `/customer/catalog?branch=${encodeURIComponent(branch.name)}`
              )
            }
            className="flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-muted/50 md:p-6"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Store className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-foreground">
                {branch.name}
              </h3>
              <p className="mb-2 truncate text-xs text-muted-foreground">
                {branch.location}
              </p>

              <div className="flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${openNow ? "bg-emerald-500" : "bg-destructive"}`}
                />
                <span
                  className={`text-xs font-medium ${openNow ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
                >
                  {openNow ? "Open Now • 8 AM - 5 PM" : "Closed • Opens 8 AM"}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
