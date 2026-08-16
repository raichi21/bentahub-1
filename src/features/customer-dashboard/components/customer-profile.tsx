"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { ContentCard } from "@/components/layouts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, XCircle, Camera, X, Mail, Phone, LogOut } from "lucide-react"

const MAX_IMAGE_SIZE = 2_000_000

export function CustomerProfile() {
  const { user, token, setUser, logout } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => {
      setFullName(user.fullName ?? "")
      setPhone(user.phone ?? "")
      setImage(user.image)
    }, 0)
    return () => clearTimeout(timer)
  }, [user])

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError(null)

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Image is too large. Please choose a file under 2MB.")
      e.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === "string") {
        setImage(result)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  async function handleSave() {
    if (!token || !user) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ fullName, phone, image }),
      })
      const data = await res.json()
      if (data.success) {
        setUser({ ...user, fullName, phone: phone || null, image })
        setMessage({ type: "success", text: "Profile updated successfully!" })
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update profile" })
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  const initials = (fullName || user?.fullName || "U")
    .split(" ")
    .map((n) => n.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)

  return (
    <>
      <ContentCard subtitle="Edit your personal information">
      <div className="space-y-6 max-w-md">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 rounded-full bg-primary/10 border border-border shrink-0">
            <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
              {image ? (
                <Image src={image} alt="Profile picture" width={96} height={96} className="w-full h-full object-cover" unoptimized />
              ) : (
                <span className="text-2xl font-bold text-primary">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-background hover:bg-primary/90 transition-colors"
              title="Change profile picture"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload Photo
            </Button>
            {image && (
              <button
                type="button"
                onClick={() => setImage(null)}
                className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
              >
                <X className="w-3 h-3" />
                Remove photo
              </button>
            )}
            {imageError && <p className="text-xs text-red-600">{imageError}</p>}
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="profile-name">Full Name</Label>
          <Input
            id="profile-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />
        </div>

        {/* Email — read-only */}
        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="profile-email"
              value={user?.email ?? ""}
              disabled
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">Your email is used for login and cannot be changed.</p>
        </div>

        {/* Contact Number */}
        <div className="space-y-2">
          <Label htmlFor="profile-phone">Contact Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 09171234567"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
          {message && (
            <span className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {message.type === "success"
                ? <CheckCircle className="w-4 h-4 inline mr-1" />
                : <XCircle className="w-4 h-4 inline mr-1" />}
              {message.text}
            </span>
          )}
        </div>
        </div>
      </ContentCard>

      <ContentCard subtitle="Sign out of your account">
        <div className="max-w-md">
          <Button type="button" variant="destructive" className="w-full flex items-center justify-center gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </ContentCard>
    </>
  )
}
