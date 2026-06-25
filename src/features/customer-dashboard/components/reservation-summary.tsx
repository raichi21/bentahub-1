"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ReservationSummary() {
  const router = useRouter()

  return (
    <div className="space-y-6 md:col-span-4">
      {/* Summary Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-bold tracking-widest text-muted-foreground mb-4 uppercase">
          Order Summary
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ready for Pickup</span>
            <span className="font-bold text-primary">1</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Processing</span>
            <span className="font-bold text-foreground">2</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completed</span>
            <span className="font-bold text-foreground">12</span>
          </div>
          
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center justify-between text-base font-bold">
              <span className="text-foreground">Total Reservations</span>
              <span className="text-primary">15</span>
            </div>
          </div>
        </div>

        <Button className="w-full mt-4" variant="outline" size="sm" onClick={() => router.push("/customer/orders")}>
          View All History
        </Button>
      </div>
    </div>
  )
}
