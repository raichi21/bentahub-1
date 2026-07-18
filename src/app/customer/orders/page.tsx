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
  const [dateFrom, setDateFrom] = useState("")

  return (
    <div className="space-y-6">
      <TransactionFilters
        tabs={HISTORY_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
      />

      <TransactionTable filters={{ activeTab, searchQuery, dateFrom }} />
    </div>
  )
}
