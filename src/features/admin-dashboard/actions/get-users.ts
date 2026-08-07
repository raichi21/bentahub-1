import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq, and, desc } from "drizzle-orm"
import type { UserMetricsData, UserRowData } from "@/types/admin"

export interface UserFilterOptions {
  role?: string
  search?: string
  page: number
  pageSize: number
}

export interface UsersPageData {
  metrics: UserMetricsData
  users: UserRowData[]
  totalCount: number
}

export async function getUsers(filters: UserFilterOptions = { page: 1, pageSize: 15 }): Promise<UsersPageData> {
  const baseConditions = [eq(users.isActive, true)]
  if (filters.role) {
    baseConditions.push(eq(users.role, filters.role as "admin" | "cashier" | "staff" | "customer"))
  }
  const where = and(...baseConditions)

  const allUsers = await db.query.users.findMany({
    where,
    orderBy: [desc(users.createdAt)],
  }) as Array<{
    id: string; fullName: string; email: string; role: string
    branch: string | null; isActive: boolean; createdAt: Date
  }>

  let filtered = allUsers
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = allUsers.filter((u) =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }

  const total = filtered.length
  const totalUsers = allUsers.length
  const active = allUsers.filter((u) => u.isActive).length
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const newThisWeek = allUsers.filter((u) => u.createdAt >= weekAgo).length

  const adminCount = allUsers.filter((u) => u.role === "admin").length
  const cashierCount = allUsers.filter((u) => u.role === "cashier").length
  const staffCount = allUsers.filter((u) => u.role === "staff").length
  const customerCount = allUsers.filter((u) => u.role === "customer").length

  const offset = (filters.page - 1) * filters.pageSize
  const pageRows = filtered.slice(offset, offset + filters.pageSize)
  const usersList: UserRowData[] = pageRows.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    branch: u.branch,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }))

  return {
    metrics: {
      total: totalUsers,
      active,
      newThisWeek,
      adminCount,
      cashierCount,
      staffCount,
      customerCount,
    },
    users: usersList,
    totalCount: total,
  }
}
