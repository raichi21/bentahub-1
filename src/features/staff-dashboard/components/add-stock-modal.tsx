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
}

const NEW_CATEGORY = "__new__"

export function AddStockModal({ isOpen, onClose, onSave, categories }: AddStockModalProps) {
  const [form, setForm] = useState<ProductForm>({
    name: "", category: categories[0] ?? NEW_CATEGORY, stock: 0, reorderLevel: 10, unit: "pcs", price: 0, barcode: "", image: "",
    batchNumber: "", expiryDate: "", supplier: ""
  })
  const [newCategory, setNewCategory] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isNewCategoryMode = form.category === NEW_CATEGORY
  const trimmedNewCategory = newCategory.trim()
  const isDuplicateCategory = categories.some((c) => c.toLowerCase() === trimmedNewCategory.toLowerCase())
  const isInvalidCategoryName = trimmedNewCategory.toLowerCase() === NEW_CATEGORY
  const isCategoryValid = !isNewCategoryMode || (trimmedNewCategory.length > 0 && !isDuplicateCategory && !isInvalidCategoryName)
  const isValid = Boolean(form.name.trim()) && isCategoryValid

  if (!isOpen) return null

  const handleSave = () => {
    if (!isValid) return
    const category = isNewCategoryMode ? trimmedNewCategory : form.category
    onSave({ ...form, category })
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
        setForm(f => ({ ...f, image: result }))
      }
    }
    reader.readAsDataURL(file)

    // Reset the input so the same file can be re-selected
    e.target.value = ""
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-lg font-bold text-foreground">Add New Stock</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Product Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Premium Jasmine Rice"
                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            {/* Barcode */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Barcode (Optional)</label>
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                placeholder="e.g. 4800016551234 (EAN-13)"
                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <p className="text-[10px] text-muted-foreground">The printed barcode on the product packaging. Leave blank if none.</p>
            </div>

            {/* Product Photo Section */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Product Photo</label>
              <div className="flex flex-col sm:flex-row gap-4 items-center p-4 border border-dashed border-border rounded-xl bg-muted/10">
                {/* Image Preview Box */}
                <div className="w-24 h-24 rounded-lg bg-background border border-border overflow-hidden flex-shrink-0 flex items-center justify-center relative shadow-inner">
                  {form.image ? (
                    <>
                      <Image src={form.image} alt="Product preview" width={96} height={96} className="w-full h-full object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, image: "" }))}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-2 flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-6 h-6 opacity-40 mb-1" />
                      <span className="text-[10px]">No Photo</span>
                    </div>
                  )}
                </div>

                {/* File Picker */}
                <div className="flex-1 w-full space-y-2">
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
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-4 bg-primary/10 hover:bg-primary/15 text-primary rounded-lg text-xs font-bold transition-all whitespace-nowrap w-full"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Add Image
                  </button>
                  <p className="text-[10px] text-muted-foreground">Click to choose an image file from your device.</p>
                </div>
              </div>
            </div>

            <div className={cn("space-y-1.5", isNewCategoryMode && "sm:col-span-2")}>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
                <option value={NEW_CATEGORY}>＋ Add new category...</option>
              </select>
              {isNewCategoryMode && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Type new category name..."
                    className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                  {trimmedNewCategory.length === 0 ? (
                    <p className="text-xs text-red-500 font-medium">Category name is required</p>
                  ) : isDuplicateCategory ? (
                    <p className="text-xs text-red-500 font-medium">Category &quot;{trimmedNewCategory}&quot; already exists</p>
                  ) : isInvalidCategoryName ? (
                    <p className="text-xs text-red-500 font-medium">Please enter a different category name</p>
                  ) : null}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stock Quantity</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                {["pcs", "kg", "box", "pack", "bottle", "dozen"].map((u) => (<option key={u} value={u}>{u}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Price (₱)</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Delivery Info</p>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Batch Number</label>
                <input
                  type="text"
                  value={form.batchNumber}
                  onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                  placeholder="Optional (e.g. DEL-0912)"
                  className="mt-1 w-full h-11 px-4 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  className="mt-1 w-full h-11 px-4 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Supplier</label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                  placeholder="Optional"
                  className="mt-1 w-full h-11 px-4 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
          <button onClick={onClose} className="h-11 px-6 border border-border text-muted-foreground hover:bg-muted rounded-lg text-sm font-bold transition-all">Cancel</button>
          <button
            disabled={!isValid}
            onClick={handleSave}
            className="inline-flex items-center gap-2 h-11 px-6 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>
    </div>
  )
}
