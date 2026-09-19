/**
 * Obscure an email address for display, e.g. "d***e@gmail.com".
 */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@")
  if (!domain || !user) return email
  const head = user[0] ?? ""
  const tail = user.length > 1 ? user.slice(-1) : ""
  const middle = user.length > 2 ? "*".repeat(Math.min(user.length - 2, 4)) : ""
  return `${head}${middle}${tail}@${domain}`
}

/**
 * Whether MFA is currently enforced for all users (production only).
 */
export function isMfaEnforced(): boolean {
  return process.env.NODE_ENV === "production"
}
