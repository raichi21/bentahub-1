"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { SettingsForm } from "@/features/settings"
import { useAuth } from "@/components/auth-provider"
import type { StoreSettingsData } from "@/features/settings"

export default function AdminSettingsPage() {
  const router = useRouter()
  const { token, isLoading: authLoading } = useAuth()
  const [settings, setSettings] = useState<StoreSettingsData | null>(null)
  const [loading, setLoading] = useState(true)

  const authHeaders = (): HeadersInit => {
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    return headers
  }

  useEffect(() => {
    if (authLoading) return
    if (!token) {
      router.push("/login?redirect=/admin")
      return
    }
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          headers: authHeaders(),
        })
        const json = await res.json()
        if (json.success) {
          setSettings(json.data)
        }
      } catch (err) {
        console.error("Failed to load settings:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [token, authLoading])

  const handleSave = async (data: Partial<StoreSettingsData>) => {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!json.success) {
      throw new Error(json.message)
    }
    setSettings(json.data)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load settings.</p>
      </div>
    )
  }

  return <SettingsForm initialData={settings} onSave={handleSave} />
}
