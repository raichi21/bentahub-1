import { describe, it, expect, afterAll } from "vitest"
import { generateSync } from "otplib"
import {
  generateMfaSecret,
  buildOtpauthUrl,
  encryptMfaSecret,
  decryptMfaSecret,
  verifyTotp,
  generateBackupCodes,
  hashBackupCode,
  encryptBackupCodeStore,
  verifyBackupCode,
  consumeBackupCode,
  isMfaEnforced,
} from "./mfa"

describe("MFA secret encryption", () => {
  const originalEnv = process.env.MFA_ENC_KEY

  afterAll(() => {
    if (originalEnv === undefined) delete process.env.MFA_ENC_KEY
    else process.env.MFA_ENC_KEY = originalEnv
  })

  it("round-trips a secret through encrypt/decrypt", () => {
    const secret = generateMfaSecret()
    const encrypted = encryptMfaSecret(secret)
    expect(encrypted).not.toBe(secret)
    expect(decryptMfaSecret(encrypted)).toBe(secret)
  })

  it("produces a different ciphertext for the same secret (random IV)", () => {
    const secret = generateMfaSecret()
    expect(encryptMfaSecret(secret)).not.toBe(encryptMfaSecret(secret))
  })
})

describe("TOTP verification", () => {
  it("accepts the current valid code", () => {
    const secret = generateMfaSecret()
    const code = generateSync({ secret })
    expect(verifyTotp(secret, code)).toBe(true)
  })

  it("rejects a wrong code", () => {
    const secret = generateMfaSecret()
    expect(verifyTotp(secret, "000000")).toBe(false)
  })

  it("rejects malformed input", () => {
    const secret = generateMfaSecret()
    expect(verifyTotp(secret, "abc")).toBe(false)
    expect(verifyTotp(secret, "12345")).toBe(false)
    expect(verifyTotp(secret, "6".repeat(600))).toBe(false)
  })

  it("builds an otpauth URL with the BentaHub issuer", () => {
    const secret = generateMfaSecret()
    const url = buildOtpauthUrl(secret, "user@example.com")
    expect(url).toContain("otpauth://totp/")
    expect(url).toContain("secret=")
    expect(url).toContain("example.com")
  })
})

describe("backup codes", () => {
  it("generates the requested number of formatted codes", () => {
    const codes = generateBackupCodes()
    expect(codes).toHaveLength(10)
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    }
  })

  it("verified codes match and normalized input is accepted", () => {
    const codes = generateBackupCodes()
    const stored = encryptBackupCodeStore(codes)
    expect(verifyBackupCode(codes[0], stored)).toBe(true)
    expect(verifyBackupCode(codes[0].toLowerCase(), stored)).toBe(true)
    expect(verifyBackupCode(codes[0].replace("-", ""), stored)).toBe(true)
    expect(verifyBackupCode(codes[0].replace("-", " "), stored)).toBe(true)
    expect(verifyBackupCode("AAAA-AAAA", stored)).toBe(false)
    expect(verifyBackupCode("", stored)).toBe(false)
    expect(verifyBackupCode("xyz", stored)).toBe(false)
  })

  it("stores only hashes, never plaintext", () => {
    const codes = generateBackupCodes()
    const stored = encryptBackupCodeStore(codes)
    expect(stored).not.toContain(codes[0])
  })

  it("consumes a used code and keeps the rest", () => {
    const codes = generateBackupCodes()
    const stored = encryptBackupCodeStore(codes)
    const updated = consumeBackupCode(codes[0], stored)
    expect(updated).not.toBeNull()
    expect(updated ?? "").not.toContain(hashBackupCode(codes[0]))
    expect(verifyBackupCode(codes[0], updated)).toBe(false)
    expect(verifyBackupCode(codes[1], updated)).toBe(true)
    expect(consumeBackupCode("AAAA-AAAA", stored)).toBeNull()
  })
})

describe("isMfaEnforced", () => {
  const env = process.env as Record<string, string | undefined>
  const originalEnv = process.env.NODE_ENV

  afterAll(() => {
    env.NODE_ENV = originalEnv
  })

  it("is enforced in production", () => {
    env.NODE_ENV = "production"
    expect(isMfaEnforced()).toBe(true)
  })

  it("is bypassed in development", () => {
    env.NODE_ENV = "development"
    expect(isMfaEnforced()).toBe(false)
  })
})
