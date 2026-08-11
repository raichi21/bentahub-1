"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { ContentCard } from "@/components/layouts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Bell, CheckCircle, XCircle } from "lucide-react"

interface NotifPrefs {
  orderUpdates: boolean
}

export function CustomerSettings() {
  const { user, token } = useAuth()

  const [fullName, setFullName] = useState("")
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({ orderUpdates: true })

  const [profileSaving, setProfileSaving] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)

  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [notifMessage, setNotifMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => {
      setFullName(user.fullName)
    }, 0)
    return () => clearTimeout(timer)
  }, [user])

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token])

  useEffect(() => {
    if (!token) return

    fetch("/api/customer/notification-preferences", { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNotifPrefs(data.data)
      })
      .catch(() => {})
  }, [token, authHeaders])

  async function handleSaveProfile() {
    if (!token) return
    setProfileSaving(true)
    setProfileMessage(null)
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ fullName }),
      })
      const data = await res.json()
      setProfileMessage(data.success ? "Saved!" : data.message)
    } catch {
      setProfileMessage("Failed to save")
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleSaveNotif() {
    if (!token) return
    setNotifSaving(true)
    setNotifMessage(null)
    try {
      const res = await fetch("/api/customer/notification-preferences", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(notifPrefs),
      })
      const data = await res.json()
      setNotifMessage(data.success ? "Saved!" : data.message)
    } catch {
      setNotifMessage("Failed to save")
    } finally {
      setNotifSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <ContentCard title="Profile" subtitle="Edit your personal information">
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Full Name</Label>
            <Input
              id="settings-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveProfile} disabled={profileSaving}>
              {profileSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
            {profileMessage && (
              <span className={`text-sm ${profileMessage === "Saved!" ? "text-green-600" : "text-red-600"}`}>
                {profileMessage === "Saved!" ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <XCircle className="w-4 h-4 inline mr-1" />}
                {profileMessage}
              </span>
            )}
          </div>
        </div>
      </ContentCard>

      {/* Notification Preferences */}
      <ContentCard title="Notification Preferences" subtitle="Control what notifications you receive">
        <div className="space-y-4 max-w-md">
          <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50 cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Order Updates</p>
                <p className="text-xs text-muted-foreground">Get notified when your order status changes</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifPrefs.orderUpdates}
              onClick={() => setNotifPrefs((prev) => ({ ...prev, orderUpdates: !prev.orderUpdates }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifPrefs.orderUpdates ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  notifPrefs.orderUpdates ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveNotif} disabled={notifSaving}>
              {notifSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Preferences
            </Button>
            {notifMessage && (
              <span className={`text-sm ${notifMessage === "Saved!" ? "text-green-600" : "text-red-600"}`}>
                {notifMessage === "Saved!" ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <XCircle className="w-4 h-4 inline mr-1" />}
                {notifMessage}
              </span>
            )}
          </div>
        </div>
      </ContentCard>
    </div>
  )
}
