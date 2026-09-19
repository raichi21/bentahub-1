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
  /** Short-lived JWT used to complete the MFA challenge. */
  mfaToken: string
}

/** Shape returned after a successful MFA verification/enrollment. */
export type MfaVerifyResponseData = LoginResponseData

/** Shape returned by the MFA code request endpoint. */
export interface MfaCodeSentData {
  /** The address the 6-digit code was emailed to. */
  email: string
}

/** Shape returned by the MFA status endpoint. */
export interface MfaStatusData {
  enabled: boolean
}
