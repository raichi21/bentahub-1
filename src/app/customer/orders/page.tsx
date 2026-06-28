"use client"

import { useState } from "react"
import {
  TransactionFilters,
  TransactionTable
} from "@/features/customer-dashboard"

const HISTORY_TABS = ["All", "Completed", "Cancelled"]

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("Last 30 Days")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            Transaction History
          </h1>
          <p className="text-muted-foreground mt-1">
            View your completed and past orders.
          </p>
        </div>
      </div>

      <TransactionFilters
        tabs={HISTORY_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateFilter={dateFilter}
        onDateFilterToggle={() => setDateFilter(d => d === "Last 30 Days" ? "All Time" : "Last 30 Days")}
      />

      <TransactionTable filters={{ activeTab, searchQuery, dateFilter }} />
    </div>
  )
}
