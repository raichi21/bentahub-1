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
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-4 md:p-6 border-b border-border">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold">Nearby Branches</h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (branches.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-4 md:p-6 border-b border-border">
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
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 md:p-6 border-b border-border">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-lg font-bold">Nearby Branches</h2>
      </div>

      {/* Branch List */}
      <div className="divide-y divide-border">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => router.push(`/catalog?branch=${encodeURIComponent(branch.name)}`)}
            className="p-4 md:p-6 flex items-start gap-4 w-full text-left hover:bg-muted/50 transition-colors"
          >
            <div className="size-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
              <Store className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{branch.name}</h3>
              <p className="text-xs text-muted-foreground truncate mb-2">{branch.location}</p>

              <div className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${openNow ? "bg-emerald-500" : "bg-destructive"}`} />
                <span className={`text-xs font-medium ${openNow ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
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
