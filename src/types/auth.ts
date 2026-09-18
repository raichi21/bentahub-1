import type { UserRole } from "@/config/constants"

// ---------------------------------------------------------------------------
// Database entity types
// ---------------------------------------------------------------------------

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  branchId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  user: User
  expiresAt: Date
}

// ---------------------------------------------------------------------------
// Auth context (used by AuthProvider)
// ---------------------------------------------------------------------------

export interface AuthContext {
  userId: string
  email: string
  fullName: string
  phone: string | null
  branch: string | null
  role: string
  isEmailVerified: boolean
}

// ---------------------------------------------------------------------------
// API response envelope
// ---------------------------------------------------------------------------

export interface AuthResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

// ---------------------------------------------------------------------------
// Request payloads
// ---------------------------------------------------------------------------

export interface RegisterPayload {
  email: string
  password: string
  confirmPassword: string
  fullName: string
}

export interface VerifyEmailPayload {
  email: string
  code: string
}

export interface LoginPayload {
  email: string
  password: string
}

/** Shape of the login response data (token + user info). */
export interface LoginResponseData {
  token: string
  user: {
    userId: string
    email: string
    fullName: string
    phone: string | null
    image: string | null
    branch: string | null
    role: string
    isEmailVerified: boolean
  }
}

/** Shape returned when a login must continue with an MFA challenge. */
export interface LoginChallengeData {
  requiresMfa: boolean
  /** True when the user has no MFA enrolled and must set it up now. */
  requiresMfaSetup: boolean
  /** Short-lived JWT used to complete the MFA challenge. */
  mfaToken: string
}

/** Shape returned after a successful MFA verification/enrollment. */
export interface MfaVerifyResponseData extends LoginResponseData {
  /** Backup codes shown exactly once right after enrollment. */
  backupCodes?: string[]
}

/** Shape returned by the MFA setup endpoint (enrollment QR data). */
export interface MfaSetupData {
  otpauthUrl: string
  qrCodeDataUrl: string
  manualSecret: string
}

/** Shape returned by the MFA status endpoint. */
export interface MfaStatusData {
  enabled: boolean
  backupCodesRemaining: number
}
