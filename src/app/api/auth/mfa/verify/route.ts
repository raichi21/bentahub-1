import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import {
  decryptMfaSecret,
  verifyTotp,
  verifyBackupCode,
  consumeBackupCode,
} from "@/lib/mfa"
import { resolveMfaChallengeToken, issueSession } from "../_helpers"
import type { AuthResponse, MfaVerifyResponseData } from "@/types/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_ATTEMPTS = 5
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000

// In-memory attempt tracker keyed by the hashed mfa token. Acceptable for this
// app's single-instance deployment; the window matches the token's 10-minute
// lifetime so stale entries are pruned naturally.
const attemptStore = new Map<string, { attempts: number; expiresAt: number }>()

function attemptKey(mfaToken: string): string {
  return crypto.createHash("sha256").update(mfaToken).digest("hex")
}

/** Register (or block) a failed attempt for the given mfa token. */
function registerFailedAttempt(key: string): boolean {
  const now = Date.now()
  const entry = attemptStore.get(key)
  if (!entry || entry.expiresAt < now) {
    attemptStore.set(key, { attempts: 1, expiresAt: now + ATTEMPT_WINDOW_MS })
    return true
  }
  entry.attempts += 1
  if (entry.attempts >= MAX_ATTEMPTS) {
    attemptStore.delete(key)
    return false
  }
  return true
}

function pruneAttemptStore(): void {
  if (attemptStore.size < 500) return
  const now = Date.now()
  for (const [key, entry] of attemptStore) {
    if (entry.expiresAt < now) attemptStore.delete(key)
  }
}

/**
 * POST /api/auth/mfa/verify
 *
 * Completes a login by validating the 6-digit TOTP code (or a backup code)
 * against the user's enrolled authenticator. On success it issues the full
 * session JWT, same shape as a normal login response.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse<MfaVerifyResponseData>>> {
  try {
    const body = await request.json().catch(() => null)
    const mfaToken: unknown = body?.mfaToken
    const code: unknown = body?.code

    if (
      typeof mfaToken !== "string" ||
      typeof code !== "string" ||
      !code.trim()
    ) {
      return NextResponse.json(
        { success: false, message: "MFA token and code are required" },
        { status: 400 }
      )
    }

    // --- Validate the challenge token --------------------------------------

    const challenge = resolveMfaChallengeToken<MfaVerifyResponseData>(mfaToken)
    if (challenge.error) return challenge.error

    pruneAttemptStore()
    const key = attemptKey(mfaToken)

    // --- Load the user -----------------------------------------------------

    const user = await db.query.users.findFirst({
      where: eq(users.id, challenge.identity.userId),
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "Account not found or deactivated" },
        { status: 401 }
      )
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "MFA is not enabled for this account. Please sign in again.",
        },
        { status: 400 }
      )
    }

    // --- Rate limit brute-force attempts -----------------------------------

    const secret = decryptMfaSecret(user.mfaSecret)

    const totpValid = verifyTotp(secret, code)
    const backupValid = verifyBackupCode(code, user.mfaBackupCodes)

    if (!totpValid && !backupValid) {
      if (!registerFailedAttempt(key)) {
        return NextResponse.json(
          {
            success: false,
            message: "Too many failed attempts. Please sign in again.",
          },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 401 }
      )
    }

    // A valid single-use backup code is consumed immediately.
    if (backupValid && !totpValid && user.mfaBackupCodes) {
      const updated = consumeBackupCode(code, user.mfaBackupCodes)
      if (updated !== null) {
        await db
          .update(users)
          .set({ mfaBackupCodes: updated })
          .where(eq(users.id, user.id))
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Verification successful",
        data: issueSession(user),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("MFA verify error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred during verification" },
      { status: 500 }
    )
  }
}
