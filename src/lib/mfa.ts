import crypto from "crypto"
import { generateSecret, generateURI, verifySync } from "otplib"

// ---------------------------------------------------------------------------
// TOTP configuration
// ---------------------------------------------------------------------------

const MFA_ISSUER = "BentaHub"

// Accept codes from ±1 time step (30s each) so a code entered right around
// the boundary of a step still validates. `epochTolerance` is in seconds.
const TOTP_WINDOW_SECONDS = 30

// ---------------------------------------------------------------------------
// Encryption (AES-256-GCM) for TOTP secrets at rest
// ---------------------------------------------------------------------------

/** Derive the 32-byte AES key from the MFA_ENC_KEY env var. */
function getMfaEncryptionKey(): Buffer {
  const raw = process.env.MFA_ENC_KEY
  const isPlaceholder =
    typeof raw === "string" &&
    /\bchange-me|change-this|your-secret|placeholder\b/i.test(raw)
  if (raw && raw.length >= 32 && !isPlaceholder) {
    return crypto.createHash("sha256").update(raw).digest()
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MFA_ENC_KEY must be set to a strong, unique value in production"
    )
  }
  return crypto
    .createHash("sha256")
    .update("default-mfa-encryption-key-for-development")
    .digest()
}

/** Encrypt a TOTP secret; returns `iv:authTag:data` (all base64url). */
export function encryptMfaSecret(secret: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", getMfaEncryptionKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":")
}

/** Decrypt a TOTP secret previously produced by {@link encryptMfaSecret}. */
export function decryptMfaSecret(payload: string): string {
  const [ivPart, tagPart, dataPart] = payload.split(":")
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("Invalid encrypted MFA secret")
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getMfaEncryptionKey(),
    Buffer.from(ivPart, "base64url")
  )
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

// ---------------------------------------------------------------------------
// TOTP secret helpers
// ---------------------------------------------------------------------------

/** Generate a new random base32 TOTP secret. */
export function generateMfaSecret(): string {
  return generateSecret()
}

/** Build the otpauth:// URL used to render the enrollment QR code. */
export function buildOtpauthUrl(secret: string, identifier: string): string {
  return generateURI({ issuer: MFA_ISSUER, label: identifier, secret })
}

/** Render an otpauth URL as a QR code data URL for <img>. */
export async function generateQrCodeDataUrl(
  otpauthUrl: string
): Promise<string> {
  const QRCode = (await import("qrcode")).default
  return QRCode.toDataURL(otpauthUrl, { width: 220, margin: 1 })
}

/** Verify a 6-digit TOTP code against the given secret. */
export function verifyTotp(secret: string, code: string): boolean {
  const normalized = code.replace(/\s+/g, "")
  if (!/^\d{6}$/.test(normalized)) return false
  try {
    return verifySync({
      secret,
      token: normalized,
      epochTolerance: TOTP_WINDOW_SECONDS,
    }).valid
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Backup codes
// ---------------------------------------------------------------------------

const BACKUP_CODE_COUNT = 10

/** Generate `count` human-friendly backup codes in the form `XXXX-XXXX`. */
export function generateBackupCodes(count = BACKUP_CODE_COUNT): string[] {
  return Array.from({ length: count }, () => {
    const hex = crypto.randomBytes(6).toString("hex").toUpperCase().slice(0, 8)
    return `${hex.slice(0, 4)}-${hex.slice(4)}`
  })
}

/** Normalize a backup code the user typed (strip dashes, upper/mixed case). */
function normalizeBackupCode(code: string): string {
  return code.replace(/[\s-]/g, "").toUpperCase()
}

/** SHA-256 hash of a backup code, used for secure storage. */
export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex")
}

/** Hash a set of backup codes into the JSON string stored on the user. */
export function encryptBackupCodeStore(codes: string[]): string {
  return JSON.stringify(
    codes.map((code) => hashBackupCode(normalizeBackupCode(code)))
  )
}

/**
 * Compare a user-typed backup code against the stored hashed set.
 * Returns `true` if it matches one of the stored codes.
 */
export function verifyBackupCode(
  input: string,
  storedJson: string | null
): boolean {
  if (!storedJson) return false
  try {
    const stored: unknown = JSON.parse(storedJson)
    if (!Array.isArray(stored)) return false
    const normalized = normalizeBackupCode(input)
    if (normalized.length < 8) return false
    const candidate = Buffer.from(hashBackupCode(normalized), "hex")
    for (const hash of stored) {
      if (typeof hash !== "string") continue
      const expected = Buffer.from(hash, "hex")
      if (
        candidate.length === expected.length &&
        crypto.timingSafeEqual(candidate, expected)
      ) {
        return true
      }
    }
    return false
  } catch {
    return false
  }
}

/**
 * Remove a used backup code from the stored set and return the updated JSON.
 * Returns `null` if the input code does not match any stored code.
 */
export function consumeBackupCode(
  input: string,
  storedJson: string | null
): string | null {
  if (!storedJson) return null
  try {
    const stored: unknown = JSON.parse(storedJson)
    if (!Array.isArray(stored)) return null
    const normalized = normalizeBackupCode(input)
    const candidate = Buffer.from(hashBackupCode(normalized), "hex")
    const remaining = (stored as string[]).filter((hash) => {
      const expected = Buffer.from(hash, "hex")
      return !(
        candidate.length === expected.length &&
        crypto.timingSafeEqual(candidate, expected)
      )
    })
    if (remaining.length === stored.length) return null
    return remaining.length === 0 ? "[]" : JSON.stringify(remaining)
  } catch {
    return null
  }
}

/** Whether MFA is currently enforced for all users (production only). */
export function isMfaEnforced(): boolean {
  return process.env.NODE_ENV === "production"
}
