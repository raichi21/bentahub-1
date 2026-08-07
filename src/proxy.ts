import { NextResponse } from "next/server"

/**
 * Next.js proxy (pass-through only).
 *
 * Since auth is JWT-only (stored in localStorage), the edge layer
 * cannot verify tokens — browsers don't send Authorization headers
 * on page navigations. All auth protection is handled client-side
 * via AuthProvider / useAuth and server-side via API route checks.
 */
export function proxy() {
  return NextResponse.next()
}
