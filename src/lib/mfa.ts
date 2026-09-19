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
 * Roles that are subject to MFA. Staff and cashier accounts are shared
 * work-station logins provisioned by the admin, so a personal email code
 * would lock them out; only admin and customer accounts carry a mailbox.
 */
export const MFA_REQUIRED_ROLES = ["admin", "customer"] as const

/** Whether a given role is subject to the MFA challenges. */
export function mfaAppliesToRole(role: string): boolean {
  return (MFA_REQUIRED_ROLES as readonly string[]).includes(role)
}

/**
 * Whether MFA is currently enforced for eligible roles (production only).
 */
export function isMfaEnforced(): boolean {
  return process.env.NODE_ENV === "production"
}
