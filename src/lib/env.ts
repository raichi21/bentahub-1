export const REQUIRED_ENV_KEYS = ["DATABASE_URL", "JWT_SECRET"] as const

/**
 * Returns the names of any required environment variables that are missing
 * or empty. Used by /api/health for fast deploy verification.
 */
export function missingEnvVars(keys: readonly string[] = REQUIRED_ENV_KEYS): string[] {
  return keys.filter((key) => !process.env[key])
}
