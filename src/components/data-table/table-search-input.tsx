"use client"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"

interface TableSearchInputProps {
  placeholder: string
  onSearch: (query: string) => void
  /** Debounce delay in ms. Defaults to 300 (matches the tables). */
  debounceMs?: number
  wrapperClassName?: string
  inputClassName?: string
}

const DEFAULT_WRAPPER_CLASS = "relative w-full md:w-64"
const DEFAULT_INPUT_CLASS =
  "w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-primary"

/**
 * Shared debounced search box used by report tables. Fires only when the
 * typed value changes (never on mount), like the hand-rolled versions it
 * replaces. Always reads the latest onSearch via ref so parent re-renders
 * can never restart the debounce clock.
 */
export function TableSearchInput({
  placeholder,
  onSearch,
  debounceMs = 300,
  wrapperClassName = DEFAULT_WRAPPER_CLASS,
  inputClassName = DEFAULT_INPUT_CLASS,
}: TableSearchInputProps) {
  const [value, setValue] = useState("")
  const onSearchRef = useRef(onSearch)
  const mountedRef = useRef(false)

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (debounceMs <= 0) {
      onSearchRef.current(value)
      return
    }
    const timer = setTimeout(() => onSearchRef.current(value), debounceMs)
    return () => clearTimeout(timer)
  }, [value, debounceMs])

  return (
    <div className={wrapperClassName}>
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={inputClassName}
      />
    </div>
  )
}
