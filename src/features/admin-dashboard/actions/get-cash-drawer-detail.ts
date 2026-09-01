import { db } from "@/drizzle/db"
import { transactions } from "@/drizzle/schema"
import { eq, asc } from "drizzle-orm"
import { formatPHDateTime } from "@/lib/date"

export interface CashDrawerTransactionDetail {
  id: string
  displayId: string
  createdAt: Date
  createdAtDisplay: string
  totalAmount: number
  totalAmountDisplay: string
  paymentMethod: string
  paymentMethodDisplay: string
  amountPaid: number | null
  amountPaidDisplay: string
  change: number | null
  changeDisplay: string
  status: string
  statusDisplay: string
  items: {
    productName: string
    quantity: number
    price: number
    subtotal: number
  }[]
}

export interface CashDrawerTransactionsData {
  summary: {
    transactionCount: number
    cashCount: number
    gcashCount: number
    cashTotal: number
    cashTotalDisplay: string
    gcashTotal: number
    gcashTotalDisplay: string
  }
  transactions: CashDrawerTransactionDetail[]
}

interface RawTransaction {
  id: string
  totalAmount: string
  paymentMethod: string
  status: string
  amountPaid: string | null
  change: string | null
  createdAt: Date
}

interface RawTransactionItem {
  transactionId: string
  productName: string
  quantity: number
  price: string
  subtotal: string
}

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: Date): string {
  return formatPHDateTime(d, {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })
}

export async function getCashDrawerTransactions(
  sessionId: string
): Promise<CashDrawerTransactionsData | null> {
  const sessionTxn = await db.query.transactions.findMany({
    where: eq(transactions.sessionId, sessionId),
    orderBy: [asc(transactions.createdAt)],
  }) as RawTransaction[]

  const allItems = await db.query.transactionItems.findMany() as RawTransactionItem[]
  const itemsByTxnId = new Map<string, RawTransactionItem[]>()
  for (const item of allItems) {
    const list = itemsByTxnId.get(item.transactionId)
    if (list) list.push(item)
    else itemsByTxnId.set(item.transactionId, [item])
  }

  const mappedTransactions: CashDrawerTransactionDetail[] = sessionTxn.map((t, idx) => {
    const txnItems = itemsByTxnId.get(t.id) || []
    const total = Number(t.totalAmount)
    const amountPaid = t.amountPaid != null ? Number(t.amountPaid) : null
    const change = t.change != null ? Number(t.change) : null
    return {
      id: t.id,
      displayId: `TXN-${String(idx + 1).padStart(3, "0")}`,
      createdAt: t.createdAt,
      createdAtDisplay: formatDate(t.createdAt),
      totalAmount: total,
      totalAmountDisplay: formatCurrency(total),
      paymentMethod: t.paymentMethod,
      paymentMethodDisplay: t.paymentMethod === "cash" ? "CASH" : "GCASH",
      amountPaid,
      amountPaidDisplay: amountPaid != null ? formatCurrency(amountPaid) : "—",
      change,
      changeDisplay: change != null ? formatCurrency(change) : "—",
      status: t.status,
      statusDisplay: t.status === "completed" ? "Completed" : t.status === "pending" ? "Pending" : "Cancelled",
      items: txnItems.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
    }
  })

  const transactionCount = sessionTxn.length
  const cashTxn = sessionTxn.filter((t) => t.paymentMethod === "cash")
  const gcashTxn = sessionTxn.filter((t) => t.paymentMethod === "gcash")
  const cashTotal = cashTxn.reduce((sum, t) => sum + Number(t.totalAmount), 0)
  const gcashTotal = gcashTxn.reduce((sum, t) => sum + Number(t.totalAmount), 0)

  return {
    summary: {
      transactionCount,
      cashCount: cashTxn.length,
      gcashCount: gcashTxn.length,
      cashTotal,
      cashTotalDisplay: formatCurrency(cashTotal),
      gcashTotal,
      gcashTotalDisplay: formatCurrency(gcashTotal),
    },
    transactions: mappedTransactions,
  }
}
