import { NextResponse, type NextRequest } from "next/server"
import crypto from "crypto"
import {
  buildAuthorizationUrl,
  generatePkce,
  getProviderConfig,
  isProviderConfigured,
} from "@/lib/oauth"
import type { OAuthProvider } from "@/lib/oauth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VALID_PROVIDERS: Record<string, OAuthProvider> = {
  google: "google",
  facebook: "facebook",
}

/** Redirect back to the app with a human-readable error. */
function redirectWithError(message: string): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return NextResponse.redirect(`${appUrl}/login?oauth_error=${encodeURIComponent(message)}`)
}

/**
 * GET /api/auth/oauth/:provider
 *
 * Steps 1-2 of the Authorization Code flow: build the provider's authorization
 * URL, persist a short-lived CSRF `state` (and the Google PKCE verifier) in
 * httpOnly cookies, then redirect the user to the provider consent screen.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  const { provider } = await params
  const oauthProvider = VALID_PROVIDERS[provider]

  if (!oauthProvider) {
    return redirectWithError("Unsupported sign-in provider")
  }

  if (!isProviderConfigured(oauthProvider)) {
    return redirectWithError(`${provider} sign-in is not configured yet. Please contact the administrator.`)
  }

  const config = getProviderConfig(oauthProvider)
  if (!config) {
    return redirectWithError("OAuth configuration error")
  }

  const state = crypto.randomBytes(24).toString("base64url")
  const pkce = oauthProvider === "google" ? generatePkce() : undefined

  const authUrl = buildAuthorizationUrl(oauthProvider, state, pkce?.codeChallenge)

  const response = NextResponse.redirect(authUrl)

  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes — authorize flow should complete quickly
  })

  if (pkce) {
    response.cookies.set("oauth_code_verifier", pkce.codeVerifier, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/oauth/google",
      maxAge: 600,
    })
  }

  return response
}