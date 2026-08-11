"use client"

import { cn } from "@/lib/utils"

interface ScrimProps {
  open: boolean
  onClose: () => void
}

export function Scrim({ open, onClose }: ScrimProps) {
  if (!open) return null

  return (
    <button
      type="button"
      className={cn(
        "fixed inset-0 z-[4] border-0",
        "bg-[rgba(31,24,28,0.40)] cursor-default"
      )}
      onClick={onClose}
      aria-label="关闭导航"
    />
  )
}
