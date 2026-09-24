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
 * Roles the admin global switch may force into MFA. Customer logins are
 * self-managed (opt-in via their own profile) and are never forced by the
 * admin; only admin logins fall under the global requirement flag.
 */
export const MFA_ENFORCED_ROLES = ["admin"] as const

/** Whether a given role is subject to the admin global MFA requirement. */
export function mfaEnforcedForRole(role: string): boolean {
  return (MFA_ENFORCED_ROLES as readonly string[]).includes(role)
}

/**
 * Roles that are always issued an email code at login, with no settings UI
 * and no opt-out. Customer logins are automatic: the first login runs the
 * setup flow and every later login is a verification challenge.
 */
export function mfaAutomaticForRole(role: string): boolean {
  return role === "customer"
}

/**
 * Whether MFA is currently enforced for eligible roles (production only).
 */
export function isMfaEnforced(): boolean {
  return process.env.NODE_ENV === "production"
}
