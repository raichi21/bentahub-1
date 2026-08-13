"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoreSettings {
  storeName: string
  logo: string | null
}

interface StoreSettingsContextValue {
  /** The configured store name, or "BentaHub" before/without a saved row. */
  storeName: string
  /** The configured store logo (data URL), or null. */
  logo: string | null
  /** True while the settings fetch is in-flight. */
  loading: boolean
  /** Re-fetch the settings from the server. */
  refresh: () => Promise<void>
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "BentaHub",
  logo: null,
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const StoreSettingsContext = createContext<StoreSettingsContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface StoreSettingsProviderProps {
  children: React.ReactNode
}

/**
 * Wraps the application with store settings (system name + logo).
 *
 * Fetches GET /api/settings once on mount and exposes the values through
 * `useStoreSettings()`. Falls back to defaults while loading or on error.
 */
export function StoreSettingsProvider({ children }: StoreSettingsProviderProps) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/settings")
      const json = await res.json()
      if (json.success && json.data) {
        setSettings({
          storeName: json.data.storeName ?? DEFAULT_SETTINGS.storeName,
          logo: json.data.logo ?? null,
        })
      }
    } catch {
      // Keep defaults on failure
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.success && json.data) {
          setSettings({
            storeName: json.data.storeName ?? DEFAULT_SETTINGS.storeName,
            logo: json.data.logo ?? null,
          })
        }
      })
      .catch(() => {
        // Keep defaults on failure
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <StoreSettingsContext.Provider value={{ storeName: settings.storeName, logo: settings.logo, loading, refresh }}>
      {children}
    </StoreSettingsContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Access the store settings. Must be used inside a <StoreSettingsProvider>. */
export function useStoreSettings() {
  const context = useContext(StoreSettingsContext)

  if (context === null) {
    throw new Error("useStoreSettings must be used within a StoreSettingsProvider")
  }

  return context
}
