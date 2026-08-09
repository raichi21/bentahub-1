import crypto from "crypto"
import { eq, and } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { users, oauthAccounts } from "@/drizzle/schema"
import { generateId, generateToken } from "@/lib/auth-utils"
import type { User } from "@/drizzle/schema"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OAuthProvider = "google" | "facebook"

export interface OAuthUserProfile {
  provider: OAuthProvider
  providerUserId: string
  email: string | null
  fullName: string
  avatar: string | null
  emailVerified: boolean
}

export interface OAuthProviderInfo {
  provider: OAuthProvider
  clientId: string
  clientSecret: string
  authorizeUrl: string
  tokenUrl: string
}

/** Result of exchanging the authorization code for a provider token. */
export interface OAuthTokenResult {
  accessToken: string
  idToken?: string
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Returns the configured credentials for a provider or `null` if unset. */
export function getProviderConfig(provider: OAuthProvider): OAuthProviderInfo | null {
  const env = process.env

  if (provider === "google") {
    const clientId = env.GOOGLE_CLIENT_ID
    const clientSecret = env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) return null
    return {
      provider,
      clientId,
      clientSecret,
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
    }
  }

  const clientId = env.FACEBOOK_APP_ID
  const clientSecret = env.FACEBOOK_APP_SECRET
  if (!clientId || !clientSecret) return null
  return {
    provider,
    clientId,
    clientSecret,
    authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
  }
}

/** Whether the provider has the required env credentials configured. */
export function isProviderConfigured(provider: OAuthProvider): boolean {
  return getProviderConfig(provider) !== null
}

/** The callback URL the provider should redirect to after consent. */
export function getCallbackUrl(provider: OAuthProvider): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${base}/api/auth/oauth/${provider}/callback`
}

// ---------------------------------------------------------------------------
// PKCE (OAuth 2.0 code challenge/verifier)
// ---------------------------------------------------------------------------

/** Generate a cryptographically random PKCE verifier/challenge pair. */
export function generatePkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(48).toString("base64url")
  const challengeHash = crypto.createHash("sha256").update(codeVerifier).digest("base64url")
  return { codeVerifier, codeChallenge: challengeHash }
}

// ---------------------------------------------------------------------------
// Authorization URL
// ---------------------------------------------------------------------------

/**
 * Build the provider authorization URL where the user is sent to sign in.
 * `state` must be a short-lived value persisted across the redirect.
 */
export function buildAuthorizationUrl(
  provider: OAuthProvider,
  state: string,
  codeChallenge?: string
): string {
  const config = getProviderConfig(provider)
  if (!config) throw new Error(`${provider} OAuth is not configured`)

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getCallbackUrl(provider),
    response_type: "code",
    state,
    scope: provider === "google" ? "openid email profile" : "email public_profile",
  })

  if (provider === "google") {
    params.set("prompt", "select_account")
    if (codeChallenge) {
      params.set("code_challenge", codeChallenge)
      params.set("code_challenge_method", "S256")
    }
  }

  return `${config.authorizeUrl}?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------

/** Exchange an authorization code for an access (and possibly ID) token. */
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  codeVerifier?: string
): Promise<OAuthTokenResult> {
  const config = getProviderConfig(provider)
  if (!config) throw new Error("OAuth provider is not configured")

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: getCallbackUrl(provider),
    grant_type: "authorization_code",
  })

  if (provider === "google") {
    // PKCE verifier must be sent back to Google during token exchange.
    if (!codeVerifier) throw new Error("Missing PKCE code verifier for Google exchange")
    body.set("code_verifier", codeVerifier)
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data || typeof data.access_token !== "string") {
    console.error("OAuth token exchange failed:", provider, response.status, JSON.stringify(data))
    throw new Error("Failed to exchange authorization code")
  }

  return {
    accessToken: data.access_token as string,
    idToken: typeof data.id_token === "string" ? (data.id_token as string) : undefined,
  }
}

// ---------------------------------------------------------------------------
// Profile fetch
// ---------------------------------------------------------------------------

/** Fetch the verified profile for the signed-in provider user. */
export async function fetchProviderProfile(
  provider: OAuthProvider,
  tokenResult: OAuthTokenResult
): Promise<OAuthUserProfile> {
  if (provider === "google") {
    if (!tokenResult.idToken) throw new Error("Google did not return an ID token")
    return fetchGoogleProfile(tokenResult.idToken)
  }
  return fetchFacebookProfile(tokenResult.accessToken)
}

async function fetchGoogleProfile(idToken: string): Promise<OAuthUserProfile> {
  // tokeninfo is Google's server-side id_token validation endpoint.
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
  const data = (await response.json().catch(() => null)) as {
    aud?: string
    sub?: string
    email?: string
    email_verified?: string
    name?: string
    picture?: string
  } | null

  if (!response.ok || !data || !data.sub) {
    throw new Error("Failed to validate Google ID token")
  }

  return {
    provider: "google",
    providerUserId: data.sub,
    email: data.email ?? null,
    fullName: data.name || (data.email ?? "").split("@")[0] || "Google User",
    avatar: data.picture ?? null,
    emailVerified: data.email_verified === "true",
  }
}

async function fetchFacebookProfile(accessToken: string): Promise<OAuthUserProfile> {
  const url = `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`
  const response = await fetch(url)
  const data = (await response.json().catch(() => null)) as {
    id?: string
    name?: string
    email?: string
    picture?: { data?: { url?: string } }
    error?: { message?: string }
  } | null

  if (!response.ok || !data || !data.id) {
    const message = data?.error?.message || "Failed to fetch Facebook profile"
    throw new Error(message)
  }

  return {
    provider: "facebook",
    providerUserId: data.id,
    email: data.email ?? null,
    fullName: data.name || "Facebook User",
    avatar: data.picture?.data?.url ?? null,
    emailVerified: Boolean(data.email),
  }
}

// ---------------------------------------------------------------------------
// Create / link user
// ---------------------------------------------------------------------------

/**
 * Find the provider-linked account, auto-link it to an existing customer by
 * email, or create a brand-new customer account.
 *
 * Returns the resolved user or throws a descriptive error (e.g. when the email
 * belongs to a privileged account which must not be linked via OAuth).
 */
export async function findOrCreateUserFromOAuth(profile: OAuthUserProfile): Promise<User> {
  // 1. Existing OAuth-mapped account → return its user.
  const existing = await db.query.oauthAccounts.findFirst({
    where: and(
      eq(oauthAccounts.provider, profile.provider),
      eq(oauthAccounts.providerUserId, profile.providerUserId)
    ),
  })

  if (existing) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, existing.userId),
    })
    if (!user) throw new Error("OAuth account exists but linked user was not found")
    if (!user.isActive) throw new Error("Your account has been deactivated. Please contact the administrator.")
    return user
  }

  // 2. Auto-link: same verified email as an existing customer account.
  if (profile.email && profile.emailVerified) {
    const emailUser = await db.query.users.findFirst({
      where: eq(users.email, profile.email),
    })

    if (emailUser) {
      // Never link OAuth access to privileged accounts.
      if (emailUser.role !== "customer") {
        throw new Error("This email belongs to a staff account. Please sign in with your password.")
      }
      if (!emailUser.isActive) {
        throw new Error("Your account has been deactivated. Please contact the administrator.")
      }

      await db.insert(oauthAccounts).values({
        id: generateId(),
        userId: emailUser.id,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        providerEmail: profile.email,
      })

      return emailUser
    }
  }

  // 3. No match → create a new customer account.
  const email = profile.email || fallbackEmail(profile.provider, profile.providerUserId)

  const [newUser] = await db
    .insert(users)
    .values({
      id: generateId(),
      email,
      password: null,
      fullName: profile.fullName,
      role: "customer",
      isEmailVerified: profile.emailVerified || !profile.email,
      isActive: true,
    })
    .returning()

  await db.insert(oauthAccounts).values({
    id: generateId(),
    userId: newUser.id,
    provider: profile.provider,
    providerUserId: profile.providerUserId,
    providerEmail: profile.email,
  })

  return newUser
}

/** Deterministic placeholder email when a provider does not return one. */
function fallbackEmail(provider: OAuthProvider, providerUserId: string): string {
  return `${provider}.${providerUserId}@social.bentahub.local`
}

// ---------------------------------------------------------------------------
// Session generation
// ---------------------------------------------------------------------------

/** Issue the app JWT for a user that just authenticated via OAuth. */
export function issueTokenForUser(user: User): string {
  return generateToken({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  })
}