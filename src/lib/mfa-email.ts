import { eq } from "drizzle-orm"
import { db } from "@/servers/db"
import { mfaCodes } from "@/servers/schemas"
import {
  generateId,
  generateVerificationCode,
  hashVerificationCode,
} from "@/lib/auth-utils"
import { sendMfaCodeEmail } from "@/lib/email-service"

/** Codes expire after 5 minutes, mirroring the email verification flow. */
export const MFA_CODE_EXPIRY_MS = 5 * 60 * 1000

/** Maximum failed attempts before the stored code is considered burned. */
export const MAX_MFA_ATTEMPTS = 5

/**
 * Generate a fresh 6-digit MFA code, store its hash (replacing any previous
 * pending code for the user), and email it to the account's address.
 * Returns `false` if the email could not be delivered.
 */
export async function sendMfaCode(user: {
  id: string
  email: string
  fullName: string
}): Promise<boolean> {
  const code = generateVerificationCode()

  await db.delete(mfaCodes).where(eq(mfaCodes.userId, user.id))
  await db.insert(mfaCodes).values({
    id: generateId(),
    userId: user.id,
    code: hashVerificationCode(code),
    email: user.email,
    expiresAt: new Date(Date.now() + MFA_CODE_EXPIRY_MS),
  })

  return sendMfaCodeEmail(user.email, code, user.fullName)
}

export type MfaCodeCheck =
  | { status: "ok"; attemptsLeft: number }
  | { status: "invalid"; attemptsLeft: number }
  | { status: "expired"; attemptsLeft: number }
  | { status: "locked"; attemptsLeft: number }
  | { status: "missing"; attemptsLeft: number }

/**
 * Validate a 6-digit code against the latest stored MFA code for the user.
 * Failed attempts are counted in the DB to throttle brute force. A successful
 * (or exhausted) code is consumed so it can never be replayed.
 */
export async function checkMfaCode(
  userId: string,
  code: string
): Promise<MfaCodeCheck> {
  const record = await db.query.mfaCodes.findFirst({
    where: eq(mfaCodes.userId, userId),
  })

  if (!record) {
    return { status: "missing", attemptsLeft: MAX_MFA_ATTEMPTS }
  }

  if (new Date() > record.expiresAt) {
    return { status: "expired", attemptsLeft: MAX_MFA_ATTEMPTS }
  }

  if (record.attempts >= MAX_MFA_ATTEMPTS) {
    return { status: "locked", attemptsLeft: 0 }
  }

  const matches = hashVerificationCode(code) === record.code

  if (!matches) {
    const nextAttempts = record.attempts + 1
    await db
      .update(mfaCodes)
      .set({ attempts: nextAttempts })
      .where(eq(mfaCodes.id, record.id))
    const attemptsLeft = MAX_MFA_ATTEMPTS - nextAttempts
    if (attemptsLeft <= 0) {
      return { status: "locked", attemptsLeft: 0 }
    }
    return { status: "invalid", attemptsLeft }
  }

  await db.delete(mfaCodes).where(eq(mfaCodes.id, record.id))
  return { status: "ok", attemptsLeft: MAX_MFA_ATTEMPTS }
}
