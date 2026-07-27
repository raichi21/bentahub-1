const PAYMONGO_API = "https://api.paymongo.com/v1"
const FETCH_TIMEOUT_MS = 15_000

function getSecretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not set")
  return key
}

function authHeader(): string {
  return `Basic ${Buffer.from(getSecretKey() + ":").toString("base64")}`
}

/** #11: Fetch with AbortController timeout so requests don't hang indefinitely */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
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
  successUrl?: string
  cancelUrl?: string
  billing?: {
    name: string
    email: string
  }
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

  const attributes: Record<string, unknown> = {
    line_items: lineItems,
    payment_method_types: ["gcash"],
    description: params.description || "Store purchase",
    send_email_receipt: false,
  }

  if (params.successUrl) attributes.success_url = params.successUrl
  if (params.cancelUrl) attributes.cancel_url = params.cancelUrl
  if (params.billing) attributes.billing = params.billing

  const body = {
    data: { attributes },
  }

  const res = await fetchWithTimeout(`${PAYMONGO_API}/checkout_sessions`, {
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

  const res = await fetchWithTimeout(`${PAYMONGO_API}/payment_intents`, {
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
  const res = await fetchWithTimeout(`${PAYMONGO_API}/payment_intents/${id}`, {
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
