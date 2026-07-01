export interface KpiData {
  value: string
  trend: string
  trendType: "up" | "down" | "warning"
}

export interface BranchStockData {
  id: string
  name: string
  totalItems: number
  capacity: number
  lowStockItems: number
  percentage: number
  status: "Healthy" | "Warning" | "Critical"
}

export interface SalesTrendData {
  month: string
  revenue: number
}

export interface AdminOverviewData {
  kpis: {
    totalRevenue: KpiData
    totalInventory: KpiData
    lowStockAlerts: { value: number }
  }
  salesTrend: SalesTrendData[]
  branchStock: BranchStockData[]
}

export interface MonitoringMetricsData {
  totalStockValue: { value: string; trend: string }
  lowStockItems: { value: number; severity: string }
  pendingReservations: { value: number; todayCount: number }
}

export interface InventoryStatusItem {
  productId: string
  productName: string
  category: string
  totalQuantity: number
  reorderLevel: number
  status: "Active" | "Low Stock" | "Critical"
  lastUpdated: string | Date
}

export interface SystemAlertItem {
  type: "critical" | "warning" | "success"
  title: string
  description: string
}

export interface MonitoringData {
  metrics: MonitoringMetricsData
  inventoryStatus: InventoryStatusItem[]
  alerts: SystemAlertItem[]
  branches: { id: string; name: string }[]
}

export interface SalesOverviewData {
  totalSales: number
  totalSalesDisplay: string
  transactionCount: number
  avgPerTransaction: number
  avgPerTransactionDisplay: string
  trend: string
}

export interface SalesTransactionRowData {
  id: string
  displayId: string
  branchName: string
  createdAt: Date
  totalAmount: string
  paymentMethod: string
  status: string
}

export interface SalesTrendPointData {
  month: string
  revenue: number
}

export interface SalesApiData {
  overview: SalesOverviewData
  transactions: SalesTransactionRowData[]
  totalCount: number
  branches: { id: string; name: string }[]
  salesTrend: SalesTrendPointData[]
}

export interface TopProductData {
  productId: string
  productName: string
  totalSold: number
  totalRevenue: number
  rank: number
}

export interface LowStockByCategoryData {
  category: string
  totalItems: number
  lowStockCount: number
  lowStockPercentage: number
}

export interface AdminApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}
