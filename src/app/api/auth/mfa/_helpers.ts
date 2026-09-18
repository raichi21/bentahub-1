import { NextResponse } from "next/server"
import { extractToken, verifyToken, generateToken } from "@/lib/auth-utils"
import type { AuthResponse, MfaVerifyResponseData } from "@/types/auth"

export type MfaTokenType = "full" | "mfa"

export type MfaIdentity = {
  userId: string
  tokenType: MfaTokenType
}

export type MfaAuthResult<T> =
  | { identity: MfaIdentity; error?: never }
  | { identity?: never; error: NextResponse<AuthResponse<T>> }

function authError<T>(
  message: string,
  status = 401
): NextResponse<AuthResponse<T>> {
  return NextResponse.json({ success: false, message }, { status })
}

/**
 * Resolve the acting user from a Bearer token. Both full session tokens and
 * short-lived MFA challenge tokens are accepted (the caller decides what it
 * allows). Returns an error response for missing/invalid tokens.
 */
export function resolveMfaIdentity<T>(request: {
  headers: { get: (name: string) => string | null }
}): MfaAuthResult<T> {
  const token = extractToken(request)
  if (!token) return { error: authError<T>("Authentication required") }
  const payload = verifyToken(token)
  if (!payload) return { error: authError<T>("Invalid or expired token") }
  if (payload.tokenType === "mfa") {
    return { identity: { userId: payload.userId, tokenType: "mfa" } }
  }
  return { identity: { userId: payload.userId, tokenType: "full" } }
}

/**
 * Resolve the user behind an MFA challenge token supplied in a request body.
 * The token must be an `mfa`-scoped JWT — full session tokens are rejected.
 */
export function resolveMfaChallengeToken<T>(
  mfaToken: string
): MfaAuthResult<T> {
  const payload = verifyToken(mfaToken)
  if (!payload || payload.tokenType !== "mfa" || !payload.userId) {
    return {
      error: authError<T>("MFA session expired. Please sign in again.", 401),
    }
  }
  return { identity: { userId: payload.userId, tokenType: "mfa" } }
}

/**
 * Build the full-auth success payload (JWT + user) shared by login and
 * MFA verification. `backupCodes` is only present on first enrollment.
 */
export function issueSession(
  user: {
    id: string
    email: string
    fullName: string
    role: string
    phone: string | null
    image: string | null
    branch: string | null
    isEmailVerified: boolean
  },
  backupCodes?: string[]
): MfaVerifyResponseData {
  const token = generateToken({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  })
  return {
    token,
    user: {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      image: user.image,
      branch: user.branch,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
    ...(backupCodes ? { backupCodes } : {}),
  }
}
