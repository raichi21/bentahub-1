"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { ContentCard } from "@/components/layouts"
import { Button } from "@/components/ui/button"
import { Loader2, Save, Store, Plus, Pencil, Power, PowerOff, Camera, X, Store as StoreIcon } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { AddBranchModal } from "./add-branch-modal"
import { EditBranchModal } from "./edit-branch-modal"

const MAX_LOGO_SIZE = 2_000_000

interface Branch {
  id: string
  name: string
  location: string | null
  capacity: number | null
  isActive: boolean
  createdAt?: string | Date | null
}

interface SettingsData {
  storeName: string
  logo: string | null
  storeAddress: string | null
  storeContact: string | null
  storeEmail: string | null
}

const DEFAULT_SETTINGS: SettingsData = {
  storeName: "BentaHub",
  logo: null,
  storeAddress: null,
  storeContact: null,
  storeEmail: null,
}

export function AdminSettings() {
  const { token } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS)
  const [logo, setLogo] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [savingConfig, setSavingConfig] = useState(false)
  const [configMessage, setConfigMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [branches, setBranches] = useState<Branch[]>([])
  const [branchesLoading, setBranchesLoading] = useState(true)
  const [branchesError, setBranchesError] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.data) {
        const s = data.data
        setSettings({
          storeName: s.storeName ?? DEFAULT_SETTINGS.storeName,
          logo: s.logo ?? null,
          storeAddress: s.storeAddress ?? null,
          storeContact: s.storeContact ?? null,
          storeEmail: s.storeEmail ?? null,
        })
        setLogo(s.logo ?? null)
      }
    } catch {
      setConfigMessage({ type: "error", text: "Failed to load settings" })
    }
  }, [token])

  const fetchBranches = useCallback(async () => {
    if (!token) return
    setBranchesLoading(true)
    try {
      const res = await fetch("/api/admin/branches", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setBranches(data.data)
        setBranchesError(null)
      } else {
        setBranchesError(data.message || "Failed to load branches")
      }
    } catch {
      setBranchesError("Failed to load branches")
    } finally {
      setBranchesLoading(false)
    }
  }, [token])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSettings()
      fetchBranches()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchSettings, fetchBranches])

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token])

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError(null)

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError("Logo is too large. Please choose a file under 2MB.")
      e.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === "string") {
        setLogo(result)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleSaveConfig = async () => {
    if (!token) return
    setSavingConfig(true)
    setConfigMessage(null)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          storeName: settings.storeName,
          logo,
          storeAddress: settings.storeAddress,
          storeContact: settings.storeContact,
          storeEmail: settings.storeEmail,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setConfigMessage({ type: "success", text: "Settings saved successfully" })
        fetchSettings()
      } else {
        setConfigMessage({ type: "error", text: data.message || "Failed to save settings" })
      }
    } catch {
      setConfigMessage({ type: "error", text: "An error occurred" })
    } finally {
      setSavingConfig(false)
    }
  }

  const handleToggleBranch = async (branch: Branch) => {
    if (!token) return
    setTogglingId(branch.id)
    try {
      const res = await fetch(`/api/admin/branches?id=${branch.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          name: branch.name,
          location: branch.location,
          capacity: branch.capacity ?? 500,
          isActive: !branch.isActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setBranches((prev) =>
          prev.map((b) => (b.id === branch.id ? { ...b, isActive: !branch.isActive } : b))
        )
      }
    } catch {
      setBranchesError("Failed to update branch status")
    } finally {
      setTogglingId(null)
    }
  }

  const activeCount = branches.filter((b) => b.isActive).length

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      {/* ── BentaHub Configuration ── */}
      <ContentCard
        title="BentaHub Configuration"
        subtitle="General settings for your system — name, logo, and contact information."
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative size-20 shrink-0">
              <div className="relative size-20 rounded-full border border-border bg-muted overflow-hidden flex items-center justify-center">
                {logo ? (
                  <Image src={logo} alt="Store logo" fill className="object-contain p-2" sizes="80px" />
                ) : (
                  <StoreIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground border-2 border-background flex items-center justify-center shadow-md hover:opacity-95 transition-opacity"
                aria-label="Upload logo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              {logo && (
                <button
                  type="button"
                  onClick={() => setLogo(null)}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-white border-2 border-background flex items-center justify-center shadow-md hover:opacity-95 transition-opacity"
                  aria-label="Remove logo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Store Logo</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, or GIF under 2MB.</p>
              {logoError && <p className="text-xs font-medium text-destructive">{logoError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">System Name</label>
              <input className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm" value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} placeholder="BentaHub" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Number</label>
              <input className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm" value={settings.storeContact ?? ""} onChange={(e) => setSettings({ ...settings, storeContact: e.target.value })} placeholder="+63 900 000 0000" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Email</label>
              <input className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm" type="email" value={settings.storeEmail ?? ""} onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })} placeholder="hello@bentahub.com" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Store Address</label>
              <input className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm" value={settings.storeAddress ?? ""} onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })} placeholder="e.g. Lourdes, Cagayan de Oro City" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            {configMessage && (
              <p className={`text-sm font-medium ${configMessage.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {configMessage.text}
              </p>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <Button type="button" variant="outline" onClick={() => fetchSettings()} disabled={savingConfig}>
                Reset
              </Button>
              <Button type="button" onClick={handleSaveConfig} disabled={savingConfig || !token}>
                {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </ContentCard>

      {/* ── Branch / Store Management ── */}
      <ContentCard
        title="Branch / Store Management"
        subtitle={`${activeCount} active of ${branches.length} branches`}
        actions={
          <Button type="button" size="sm" onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Branch
          </Button>
        }
      >
        <div className="space-y-4">
          {branchesError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">{branchesError}</div>
          )}

          {branchesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</th>
                    <th className="pb-3 pr-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</th>
                    <th className="pb-3 pr-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Capacity</th>
                    <th className="pb-3 pr-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground">No branches yet. Click &quot;Add Branch&quot; to create one.</td>
                    </tr>
                  ) : (
                    branches.map((branch) => (
                      <tr key={branch.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Store className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-foreground">{branch.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{branch.location ?? "—"}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{branch.capacity ?? 500}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            branch.isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {branch.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              onClick={() => {
                                setEditBranch(branch)
                                setEditModalOpen(true)
                              }}
                              aria-label={`Edit ${branch.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className={`p-2 rounded-lg transition-colors ${
                                branch.isActive
                                  ? "text-destructive hover:bg-destructive/10"
                                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                              }`}
                              onClick={() => handleToggleBranch(branch)}
                              disabled={togglingId === branch.id}
                              aria-label={branch.isActive ? `Deactivate ${branch.name}` : `Activate ${branch.name}`}
                            >
                              {togglingId === branch.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : branch.isActive ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ContentCard>

      <AddBranchModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        token={token}
        onSuccess={() => {
          setAddModalOpen(false)
          fetchBranches()
        }}
      />
      <EditBranchModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        token={token}
        branch={editBranch}
        onSuccess={() => {
          setEditModalOpen(false)
          setEditBranch(null)
          fetchBranches()
        }}
      />
    </div>
  )
}
