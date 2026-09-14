"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { X, Plus, Image as ImageIcon, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductForm {
  name: string
  category: string
  stock: number
  reorderLevel: number
  unit: string
  price: number
  barcode: string
  image: string
  batchNumber: string
  expiryDate: string
  supplier: string
}

interface AddStockModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: ProductForm) => void
  categories: string[]
  units: string[]
}

export function AddStockModal({
  isOpen,
  onClose,
  onSave,
  categories,
  units,
}: AddStockModalProps) {
  const [form, setForm] = useState<ProductForm>({
    name: "",
    category: categories[0] ?? "",
    stock: 0,
    reorderLevel: 10,
    unit: units[0] ?? "pcs",
    price: 0,
    barcode: "",
    image: "",
    batchNumber: "",
    expiryDate: "",
    supplier: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isValid =
    Boolean(form.name.trim()) && Boolean(form.category) && Boolean(form.unit)

  if (!isOpen) return null

  const handleSave = () => {
    if (!isValid) return
    onSave({ ...form, category: form.category, unit: form.unit })
    onClose()
  }

  const handleCategoryChange = (cat: string) => {
    setForm((f) => ({ ...f, category: cat }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === "string") {
        setForm((f) => ({ ...f, image: result }))
      }
    }
    reader.readAsDataURL(file)

    // Reset the input so the same file can be re-selected
    e.target.value = ""
  }

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto flex max-h-[90vh] w-full max-w-lg animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">Add New Stock</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar space-y-5 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Product Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Premium Jasmine Rice"
                className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Barcode */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Barcode (Optional)
              </label>
              <input
                type="text"
                value={form.barcode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, barcode: e.target.value }))
                }
                placeholder="e.g. 4800016551234 (EAN-13)"
                className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground">
                The printed barcode on the product packaging. Leave blank if
                none.
              </p>
            </div>

            {/* Product Photo Section */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Product Photo
              </label>
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/10 p-4 sm:flex-row">
                {/* Image Preview Box */}
                <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background shadow-inner">
                  {form.image ? (
                    <>
                      <Image
                        src={form.image}
                        alt="Product preview"
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, image: "" }))}
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
                      <ImageIcon className="mb-1 h-6 w-6 opacity-40" />
                      <span className="text-[10px]">No Photo</span>
                    </div>
                  )}
                </div>

                {/* File Picker */}
                <div className="w-full flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-4 text-xs font-bold whitespace-nowrap text-primary transition-all hover:bg-primary/15"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Add Image
                  </button>
                  <p className="text-[10px] text-muted-foreground">
                    Click to choose an image file from your device.
                  </p>
                </div>
              </div>
            </div>

            <div className={cn("space-y-1.5", "sm:col-span-2")}>
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Stock Quantity
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.stock}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    stock: Math.max(0, parseInt(e.target.value) || 0),
                  }))
                }
                className="h-11 w-full rounded-lg border border-border bg-background px-4 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Unit
              </label>
              <select
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
                className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Price (₱)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    price: Math.max(0, parseFloat(e.target.value) || 0),
                  }))
                }
                className="h-11 w-full rounded-lg border border-border bg-background px-4 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:col-span-2">
              <p className="text-xs font-bold tracking-wider text-primary uppercase">
                Delivery Info
              </p>
              <div>
                <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={form.batchNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, batchNumber: e.target.value }))
                  }
                  placeholder="Optional (e.g. DEL-0912)"
                  className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expiryDate: e.target.value }))
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Supplier
                </label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplier: e.target.value }))
                  }
                  placeholder="Optional"
                  className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <button
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-6 text-sm font-bold text-muted-foreground transition-all hover:bg-muted"
          >
            Cancel
          </button>
          <button
            disabled={!isValid}
            onClick={handleSave}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/95 disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>
    </div>
  )
}
