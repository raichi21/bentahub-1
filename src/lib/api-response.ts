/**
 * Standard API JSON response builder
 *
 * Follows FSD API Route Pattern: returns `new Response()` instead of `NextResponse.json()`
 *
 * @example
 * ```ts
 * import { apiResponse, apiError } from "@/lib/api-response"
 *
 * export async function GET() {
 *   const data = await getProducts()
 *   return apiResponse({ data })
 * }
 *
 * export async function POST() {
 *   return apiError("Unauthorized", 401)
 * }
 * ```
 */

export function apiResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  })
}

export function apiError(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { "content-type": "application/json" },
  })
}
