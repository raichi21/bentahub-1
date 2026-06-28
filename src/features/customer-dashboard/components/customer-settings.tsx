"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { ContentCard } from "@/components/layouts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Bell, User, MapPin, CheckCircle, XCircle } from "lucide-react"

interface Branch {
  id: string
  name: string
  location: string | null
}

interface NotifPrefs {
  orderUpdates: boolean
}

export function CustomerSettings() {
  const { user, token } = useAuth()

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("")

  const [branches, setBranches] = useState<Branch[]>([])
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({ orderUpdates: true })

  const [profileSaving, setProfileSaving] = useState(false)
  const [branchSaving, setBranchSaving] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)

  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [branchMessage, setBranchMessage] = useState<string | null>(null)
  const [notifMessage, setNotifMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setFullName(user.fullName)
    setPhone(user.phone ?? "")
    setSelectedBranch(user.branch ?? "")
  }, [user])

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token])

  useEffect(() => {
    if (!token) return

    fetch("/api/branches", { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBranches(data.data)
      })
      .catch(() => {})

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
        body: JSON.stringify({ fullName, phone: phone || null }),
      })
      const data = await res.json()
      setProfileMessage(data.success ? "Saved!" : data.message)
    } catch {
      setProfileMessage("Failed to save")
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleSaveBranch() {
    if (!token) return
    setBranchSaving(true)
    setBranchMessage(null)
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ fullName, phone: phone || null, branch: selectedBranch || null }),
      })
      const data = await res.json()
      setBranchMessage(data.success ? "Saved!" : data.message)
    } catch {
      setBranchMessage("Failed to save")
    } finally {
      setBranchSaving(false)
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
          <div className="space-y-2">
            <Label htmlFor="settings-phone">Phone (optional)</Label>
            <Input
              id="settings-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09XXXXXXXXX"
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

      {/* Preferred Branch */}
      <ContentCard title="Preferred Branch" subtitle="Choose your preferred store branch">
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="settings-branch">Branch</Label>
            <select
              id="settings-branch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveBranch} disabled={branchSaving}>
              {branchSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
            {branchMessage && (
              <span className={`text-sm ${branchMessage === "Saved!" ? "text-green-600" : "text-red-600"}`}>
                {branchMessage === "Saved!" ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <XCircle className="w-4 h-4 inline mr-1" />}
                {branchMessage}
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
