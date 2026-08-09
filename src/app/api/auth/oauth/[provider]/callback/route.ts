import { NextResponse, type NextRequest } from "next/server"
import {
  exchangeCodeForToken,
  fetchProviderProfile,
  findOrCreateUserFromOAuth,
  issueTokenForUser,
} from "@/lib/oauth"
import type { OAuthProvider } from "@/lib/oauth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VALID_PROVIDERS: Record<string, OAuthProvider> = {
  google: "google",
  facebook: "facebook",
}

const SESSION_COOKIES = ["oauth_state", "oauth_code_verifier"] as const

/** Apply the ephemeral OAuth cookies to a response's Set-Cookie headers. */
function clearOAuthCookies(response: NextResponse): NextResponse {
  for (const name of SESSION_COOKIES) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    })
  }
  return response
}

/** Redirect back to the app with a human-readable error. */
function redirectWithError(message: string): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return clearOAuthCookies(
    NextResponse.redirect(`${appUrl}/login?oauth_error=${encodeURIComponent(message)}`)
  )
}

/**
 * GET /api/auth/oauth/:provider/callback
 *
 * Steps 3-5: validate the CSRF state cookie, exchange the code for a token,
 * fetch the provider profile, then link-or-create the customer account and
 * hand the JWT back to the client via a redirect to /oauth-result.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  const { provider } = await params
  const oauthProvider = VALID_PROVIDERS[provider]

  if (!oauthProvider) {
    return redirectWithError("Invalid sign-in provider")
  }

  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const expectedState = request.cookies.get("oauth_state")?.value

  // CSRF protection: the state in the URL must match the cookie we set.
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithError("Sign-in did not validate. Please try again.")
  }

  try {
    const codeVerifier = request.cookies.get("oauth_code_verifier")?.value ?? undefined

    const tokenResult = await exchangeCodeForToken(oauthProvider, code, codeVerifier)
    const profile = await fetchProviderProfile(oauthProvider, tokenResult)
    const user = await findOrCreateUserFromOAuth(profile)
    const jwt = issueTokenForUser(user)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const result = clearOAuthCookies(
      NextResponse.redirect(`${appUrl}/oauth-result?token=${encodeURIComponent(jwt)}`)
    )

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : "Social sign-in failed"
    console.error("OAuth callback error:", message)
    return redirectWithError(message)
  }
}