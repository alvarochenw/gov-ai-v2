"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModeCardProps {
  name: string
  description: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}

export function ModeCard({ name, description, icon: Icon, active, onClick }: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[132px] max-[500px]:min-h-[108px] border border-line rounded-[18px] p-[17px]",
        "text-left cursor-pointer bg-white/80 relative overflow-hidden",
        "transition-[border-color,background,transform,box-shadow] duration-150",
        active || "hover:border-[rgba(200,60,78,0.26)] hover:bg-white hover:shadow-[0_8px_24px_rgba(74,49,60,0.06)] hover:-translate-y-0.5",
        active && "border-[rgba(200,60,78,0.26)] bg-white shadow-[0_8px_24px_rgba(74,49,60,0.06)] -translate-y-0.5",
        "active:translate-y-[1px]"
      )}
    >
      {/* Decorative circle */}
      <span
        className={cn(
          "absolute w-[76px] h-[76px] rounded-full -right-[25px] -bottom-[34px]",
          "bg-[rgba(200,60,78,0.04)] transition-transform duration-200",
          active && "scale-[1.45]"
        )}
      />
      <span className="w-10 h-10 grid place-items-center rounded-[13px] text-accent-deep bg-accent-soft relative z-1">
        <Icon className="w-[21px] h-[21px]" />
      </span>
      <b className="block mt-[14px] text-sm relative z-1">{name}</b>
      <small className="block mt-1.5 text-muted-text leading-[1.55] text-[11px] relative z-1">
        {description}
      </small>
    </button>
  )
}
