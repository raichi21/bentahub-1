const PAYMONGO_API = "https://api.paymongo.com/v1"

function getSecretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not set")
  return key
}

function authHeader(): string {
  return `Basic ${Buffer.from(getSecretKey() + ":").toString("base64")}`
}

export interface PayMongoPaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  checkoutUrl: string | null
  clientKey: string | null
}

// ── Checkout Sessions (for GCash QR) ──

export interface CheckoutSessionResult {
  id: string
  checkoutUrl: string
  paymentIntentId: string
  status: string
  amount: number
  currency: string
}

/**
 * Creates a PayMongo Checkout Session for GCash payments.
 * This returns a `checkout_url` that can be encoded in a QR code.
 */
export async function createCheckoutSession(params: {
  amount: number // in centavos
  description?: string
  lineItems?: Array<{ name: string; amount: number; quantity: number }>
}): Promise<CheckoutSessionResult> {
  const lineItems = params.lineItems && params.lineItems.length > 0
    ? params.lineItems.map((item) => ({
        name: item.name,
        amount: item.amount,
        currency: "PHP",
        quantity: item.quantity,
      }))
    : [
        {
          name: params.description || "Store purchase",
          amount: params.amount,
          currency: "PHP",
          quantity: 1,
        },
      ]

  const body = {
    data: {
      attributes: {
        line_items: lineItems,
        payment_method_types: ["gcash"],
        description: params.description || "Store purchase",
        send_email_receipt: false,
      },
    },
  }

  const res = await fetch(`${PAYMONGO_API}/checkout_sessions`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayMongo CheckoutSession error: ${err}`)
  }

  const json = await res.json()
  const attrs = json.data.attributes

  return {
    id: json.data.id,
    checkoutUrl: attrs.checkout_url,
    paymentIntentId: attrs.payment_intent?.id || "",
    status: attrs.status,
    amount: attrs.amount || params.amount,
    currency: attrs.currency || "PHP",
  }
}

// ── Payment Intents (for status checking) ──

export async function createPaymentIntent(params: {
  amount: number
  description?: string
  returnUrl?: string
}): Promise<PayMongoPaymentIntent> {
  const body: { data: { attributes: Record<string, unknown> } } = {
    data: {
      attributes: {
        amount: params.amount,
        currency: "PHP",
        payment_method_allowed: ["gcash"],
        description: params.description || "Store purchase",
      },
    },
  }

  if (params.returnUrl) {
    body.data.attributes.payment_method_options = {
      card: { request_three_d_secure: "any" },
    }
  }

  const res = await fetch(`${PAYMONGO_API}/payment_intents`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayMongo error: ${err}`)
  }

  const json = await res.json()
  const attrs = json.data.attributes

  return {
    id: json.data.id,
    amount: attrs.amount,
    currency: attrs.currency,
    status: attrs.status,
    checkoutUrl: attrs.next_action?.redirect?.url || null,
    clientKey: attrs.client_key || null,
  }
}

export async function retrievePaymentIntent(id: string): Promise<PayMongoPaymentIntent> {
  const res = await fetch(`${PAYMONGO_API}/payment_intents/${id}`, {
    headers: { Authorization: authHeader() },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayMongo error: ${err}`)
  }

  const json = await res.json()
  const attrs = json.data.attributes

  return {
    id: json.data.id,
    amount: attrs.amount,
    currency: attrs.currency,
    status: attrs.status,
    checkoutUrl: attrs.next_action?.redirect?.url || null,
    clientKey: attrs.client_key || null,
  }
}

export function isPaymentSuccessful(status: string): boolean {
  return status === "succeeded"
}

export function isPaymentPending(status: string): boolean {
  return status === "awaiting_payment_method" || status === "awaiting_next_action"
}
