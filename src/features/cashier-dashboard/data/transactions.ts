import type { Transaction } from "@/types/cashier"

export const transactions: Transaction[] = [
  {
    id: "TXN-1001",
    receiptNumber: 1,
    date: "2026-05-22T08:15:30Z",
    items: [
      { productId: "prod-001", name: "Premium Jasmine Rice (5kg)", qty: 2, price: 345.0 },
      { productId: "prod-002", name: "Refined White Sugar (1kg)", qty: 3, price: 82.5 }
    ],
    subtotal: 937.5,
    discount: 0,
    total: 937.5,
    paymentMethod: "cash",
    amountPaid: 1000.0,
    change: 62.5,
    cashier: "Ron Lim",
    status: "completed"
  },
  {
    id: "TXN-1002",
    receiptNumber: 2,
    date: "2026-05-22T08:42:10Z",
    items: [
      { productId: "prod-005", name: "Instant Coffee Jar (200g)", qty: 1, price: 189.0 },
      { productId: "prod-006", name: "Fresh Whole Milk (1L)", qty: 2, price: 98.0 }
    ],
    subtotal: 385.0,
    discount: 0,
    total: 385.0,
    paymentMethod: "gcash",
    amountPaid: 385.0,
    change: 0.0,
    cashier: "Ron Lim",
    status: "completed"
  },
  {
    id: "TXN-1003",
    receiptNumber: 3,
    date: "2026-05-22T09:05:45Z",
    items: [
      { productId: "prod-003", name: "Moisturizing Soap (135g)", qty: 5, price: 48.0 },
      { productId: "prod-012", name: "Potato Chips (150g)", qty: 2, price: 78.0 }
    ],
    subtotal: 396.0,
    discount: 20.0,
    total: 376.0,
    paymentMethod: "cash",
    amountPaid: 500.0,
    change: 124.0,
    cashier: "Ron Lim",
    status: "completed"
  },
  {
    id: "TXN-1004",
    receiptNumber: 4,
    date: "2026-05-22T09:30:00Z",
    items: [
      { productId: "prod-009", name: "Paracetamol Tablets (500mg x 20)", qty: 1, price: 42.0 }
    ],
    subtotal: 42.0,
    discount: 0,
    total: 42.0,
    paymentMethod: "cash",
    amountPaid: 50.0,
    change: 8.0,
    cashier: "Ron Lim",
    status: "completed"
  },
  {
    id: "TXN-1005",
    receiptNumber: 5,
    date: "2026-05-22T10:12:15Z",
    items: [
      { productId: "prod-015", name: "Vitamin C (500mg x 30)", qty: 2, price: 135.0 },
      { productId: "prod-010", name: "Shampoo Sachet (12ml x 12)", qty: 1, price: 72.0 }
    ],
    subtotal: 342.0,
    discount: 0,
    total: 342.0,
    paymentMethod: "gcash",
    amountPaid: 342.0,
    change: 0,
    cashier: "Ron Lim",
    status: "completed"
  },
  {
    id: "TXN-1006",
    receiptNumber: 6,
    date: "2026-05-22T11:45:00Z",
    items: [
      { productId: "prod-007", name: "Cheese Crackers (250g)", qty: 10, price: 56.0 }
    ],
    subtotal: 560.0,
    discount: 50.0,
    total: 510.0,
    paymentMethod: "cash",
    amountPaid: 1000.0,
    change: 490.0,
    cashier: "Ron Lim",
    status: "cancelled"
  },
  {
    id: "TXN-1007",
    receiptNumber: 7,
    date: "2026-05-22T13:20:18Z",
    items: [
      { productId: "prod-011", name: "Orange Juice (1L)", qty: 4, price: 125.0 }
    ],
    subtotal: 500.0,
    discount: 0,
    total: 500.0,
    paymentMethod: "gcash",
    amountPaid: 500.0,
    change: 0,
    cashier: "Ron Lim",
    status: "completed"
  }
]
