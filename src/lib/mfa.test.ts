import { describe, it, expect, afterAll } from "vitest"
import { isMfaEnforced, maskEmail } from "./mfa"

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

describe("maskEmail", () => {
  it("masks the middle of the local part and keeps the domain", () => {
    expect(maskEmail("davebuemia211@gmail.com")).toBe("d****1@gmail.com")
  })

  it("obscures single-character and two-character local parts", () => {
    expect(maskEmail("a@gmail.com")).toBe("a@gmail.com")
    expect(maskEmail("ab@gmail.com")).toBe("ab@gmail.com")
  })

  it("returns the input unchanged when it has no domain", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email")
  })
})
