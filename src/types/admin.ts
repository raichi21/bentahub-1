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

export interface SalesTrendWeeklyData {
  weekLabel: string
  revenue: number
}

export interface SalesTrendDailyData {
  day: string
  revenue: number
}

export interface PaymentBreakdownData {
  cashTotal: number
  cashTotalDisplay: string
  gcashTotal: number
  gcashTotalDisplay: string
  cashPercentage: number
  gcashPercentage: number
  totalDisplay: string
}

export interface AdminOverviewData {
  kpis: {
    totalRevenue: KpiData
    totalInventory: KpiData
    lowStockAlerts: { value: number }
  }
  salesTrend: SalesTrendData[]
  weeklyTrend: SalesTrendWeeklyData[]
  dailyTrend: SalesTrendDailyData[]
  branchStock: BranchStockData[]
  paymentBreakdown: PaymentBreakdownData
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
  branchId: string
  branchName: string
  totalQuantity: number
  reorderLevel: number
  status: "In Stock" | "Low Stock" | "Critical"
  lastUpdated: string | Date
}

export interface SystemAlertItem {
  type: "critical" | "warning" | "success"
  title: string
  description: string
}

export interface ExpiringItemData {
  productId: string
  productName: string
  category: string
  batchNumber: string | null
  quantity: number
  expiryDate: string
  daysUntilExpiry: number
  branchName: string
}

export interface MonitoringData {
  metrics: MonitoringMetricsData
  inventoryStatus: InventoryStatusItem[]
  alerts: SystemAlertItem[]
  branches: { id: string; name: string }[]
  expiringItems: ExpiringItemData[]
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

export interface ReservationMetricsData {
  total: number
  totalTrend: string
  pending: number
  completed: number
  cancelled: number
}

export interface ReservationRowData {
  id: string
  displayId: string
  customerName: string
  customerInitials: string
  customerEmail: string
  customerPhone: string | null
  branch: string
  itemsCount: number
  totalAmount: string
  items: ReservationItemData[]
  pickupDeadline: string | null
  status: string
  createdAt: Date
}

export interface ReservationItemData {
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export interface ReservationApiData {
  metrics: ReservationMetricsData
  reservations: ReservationRowData[]
  totalCount: number
  branches: { id: string; name: string }[]
}

export interface UserRowData {
  id: string
  fullName: string
  email: string
  role: string
  branch: string | null
  isActive: boolean
  createdAt: Date
}

export interface UserMetricsData {
  total: number
  active: number
  newThisWeek: number
  adminCount: number
  cashierCount: number
  staffCount: number
  customerCount: number
}

export interface UsersApiData {
  metrics: UserMetricsData
  users: UserRowData[]
  totalCount: number
}

export interface PaymentMetricsData {
  totalAmount: number
  totalAmountDisplay: string
  cashTotal: number
  cashTotalDisplay: string
  gcashTotal: number
  gcashTotalDisplay: string
  cashPercentage: number
  gcashPercentage: number
  completedCount: number
  pendingCount: number
  cancelledCount: number
  totalCount: number
}

export interface PaymentRowData {
  id: string
  displayId: string
  transactionId: string
  transactionDisplayId: string
  amount: number
  amountDisplay: string
  method: string
  methodDisplay: string
  dateTime: Date
  dateTimeDisplay: string
  branchId: string
  branchName: string
  status: string
  statusDisplay: string
}

export interface PaymentApiData {
  metrics: PaymentMetricsData
  payments: PaymentRowData[]
  branches: { id: string; name: string }[]
  totalCount: number
}

export interface HistoryMetricsData {
  totalTransactions: number
  totalTransactionsDisplay: string
  totalSales: number
  totalSalesDisplay: string
  trend: string
}

export interface HistoryTransactionItemData {
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export interface HistoryTransactionRowData {
  id: string
  displayId: string
  date: Date
  dateDisplay: string
  branchName: string
  itemsCount: number
  items: HistoryTransactionItemData[]
  subtotal: number
  subtotalDisplay: string
  totalAmount: number
  totalAmountDisplay: string
  paymentMethod: string
  paymentMethodDisplay: string
  status: string
  statusDisplay: string
}

export interface HistoryApiData {
  metrics: HistoryMetricsData
  transactions: HistoryTransactionRowData[]
  totalCount: number
  branches: { id: string; name: string }[]
}

export interface PickupMetricsData {
  total: number
  totalTrend: string
  completed: number
  completedRate: string
  pending: number
  urgentCount: number
  delayed: number
}

export interface PickupItemData {
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export interface PickupRowData {
  id: string
  displayId: string
  customerName: string
  customerInitials: string
  customerEmail: string
  branch: string
  itemsCount: number
  items: PickupItemData[]
  totalAmount: string
  pickupDeadline: string | null
  status: string
  statusDisplay: string
  createdAt: Date
}

export interface PickupApiData {
  metrics: PickupMetricsData
  pickups: PickupRowData[]
  totalCount: number
  branches: { id: string; name: string }[]
}

export interface AdminApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}
