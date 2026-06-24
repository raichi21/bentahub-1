"use client"

import { useState } from "react"
import { Store, Bell, ShieldCheck, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { StoreSettingsData } from "../types"

const TABS = [
  { id: "general", label: "General", icon: Store },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const

type TabId = (typeof TABS)[number]["id"]

interface SettingsFormProps {
  initialData: StoreSettingsData
  onSave: (data: Partial<StoreSettingsData>) => Promise<void>
}

export function SettingsForm({ initialData, onSave }: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general")
  const [form, setForm] = useState<StoreSettingsData>(initialData)
  const [saving, setSaving] = useState(false)

  const update = (field: keyof StoreSettingsData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* General */}
      {activeTab === "general" && (
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage your store information and business details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={form.storeName}
                onChange={(e) => update("storeName", e.target.value)}
              />
            </div>
            <Separator />
            <div className="grid gap-3">
              <Label htmlFor="storeAddress">Store Address</Label>
              <Input
                id="storeAddress"
                value={form.storeAddress}
                onChange={(e) => update("storeAddress", e.target.value)}
              />
            </div>
            <Separator />
            <div className="grid gap-3">
              <Label htmlFor="storeContact">Contact Number</Label>
              <Input
                id="storeContact"
                value={form.storeContact}
                onChange={(e) => update("storeContact", e.target.value)}
              />
            </div>
            <Separator />
            <div className="grid gap-3">
              <Label htmlFor="storeEmail">Store Email</Label>
              <Input
                id="storeEmail"
                type="email"
                value={form.storeEmail}
                onChange={(e) => update("storeEmail", e.target.value)}
              />
            </div>
            <Separator />
            <div className="grid gap-3">
              <Label htmlFor="businessHours">Business Hours</Label>
              <Input
                id="businessHours"
                placeholder="e.g. Mon-Sat 8:00 AM - 8:00 PM"
                value={form.businessHours}
                onChange={(e) => update("businessHours", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Control which system alerts and notifications are enabled.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableLowStockAlerts">Low Stock Alerts</Label>
                <p className="text-xs text-muted-foreground">Get notified when inventory runs low.</p>
              </div>
              <input
                id="enableLowStockAlerts"
                type="checkbox"
                className="size-5 rounded border-border accent-primary"
                checked={form.enableLowStockAlerts === "true"}
                onChange={(e) => update("enableLowStockAlerts", e.target.checked ? "true" : "false")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableOrderNotifications">Order Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive alerts for new orders and reservations.</p>
              </div>
              <input
                id="enableOrderNotifications"
                type="checkbox"
                className="size-5 rounded border-border accent-primary"
                checked={form.enableOrderNotifications === "true"}
                onChange={(e) => update("enableOrderNotifications", e.target.checked ? "true" : "false")}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage password policies and session configuration.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
              <Input
                id="minPasswordLength"
                type="number"
                min="6"
                max="32"
                value={form.minPasswordLength}
                onChange={(e) => update("minPasswordLength", e.target.value)}
              />
            </div>
            <Separator />
            <div className="grid gap-3">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="5"
                max="480"
                value={form.sessionTimeout}
                onChange={(e) => update("sessionTimeout", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Automatically log out inactive users after this many minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
