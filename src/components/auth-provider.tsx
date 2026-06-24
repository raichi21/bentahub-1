"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOKEN_STORAGE_KEY = "bentahub_token"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthUser {
  userId: string
  email: string
  fullName: string
  role: string
  isEmailVerified: boolean
}

interface AuthContextValue {
  /** The current authenticated user, or null if not logged in. */
  user: AuthUser | null
  /** True while the initial session check is in-flight. */
  isLoading: boolean
  /** True when a valid user session exists. */
  isAuthenticated: boolean
  /** Set or clear the current user (used after login / verify-email). */
  setUser: (user: AuthUser | null) => void
  /** Persist the JWT token (called after successful login). */
  setToken: (token: string) => void
  /** The current JWT token, or null. */
  token: string | null
  /** Log out — clears local state and removes the stored token. */
  logout: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

function storeToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

/** Build headers with the JWT Bearer token for API calls. */
function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * Wraps the application with authentication state.
 *
 * On mount it checks localStorage for a stored JWT. If found, it calls
 * GET /api/auth/verify to validate the token and hydrate the user data.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isAuthenticated = Boolean(user)

  // --- Hydrate session from stored token on mount --------------------------

  useEffect(() => {
    let cancelled = false

    let isChecking = false

    async function checkSession() {
      if (isChecking) return
      isChecking = true
      const storedToken = getStoredToken()

      if (!storedToken) {
        if (!cancelled) setIsLoading(false)
        return
      }

      try {
        const response = await fetch("/api/auth/verify", {
          headers: authHeaders(storedToken),
        })

        // If the server returned a non-OK status, avoid parsing as JSON
        if (!response.ok) {
          if (response.status !== 401) {
            const text = await response.text().catch(() => "<unable to read response>")
            console.error("/api/auth/verify returned non-OK status:", response.status, text)
          }
          clearStoredToken()
          if (!cancelled) setIsLoading(false)
          return
        }

        const data = await response.json().catch((err) => {
          console.error("Failed to parse /api/auth/verify JSON:", err)
          return null
        })

        if (!data) {
          clearStoredToken()
          if (!cancelled) setIsLoading(false)
          return
        }

        if (!cancelled && data.success && data.data) {
          setTokenState(storedToken)
          setUser(data.data)
        } else {
          // Token invalid or expired — clean up
          clearStoredToken()
        }
      } catch (err) {
        console.error("Error during auth verification:", err)
        clearStoredToken()
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      cancelled = true
    }
  }, [])

  // --- setToken: persist token & update state ------------------------------

  const setToken = useCallback((newToken: string) => {
    storeToken(newToken)
    setTokenState(newToken)
  }, [])

  // --- Logout --------------------------------------------------------------

  const logout = useCallback(async () => {
    setUser(null)
    setTokenState(null)
    clearStoredToken()

    // Best-effort server-side cleanup
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Ignore — token is already removed locally
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, setUser, setToken, token, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Access the auth context. Must be used inside an <AuthProvider>. */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
