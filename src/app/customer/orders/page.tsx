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
