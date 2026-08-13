"use client"

import { ArrowRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToolCardProps {
  name: string
  icon: LucideIcon
  variant?: "card" | "row"
  onClick?: (name: string) => void
}

export function ToolCard({
  name,
  icon: Icon,
  variant = "card",
  onClick,
}: ToolCardProps) {
  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={() => onClick?.(name)}
        className={cn(
          "border border-line rounded-[18px] px-4 py-[17px]",
          "flex items-center gap-3 cursor-pointer bg-white/80 relative overflow-hidden",
          "transition-[border-color,background,transform,box-shadow] duration-150",
          "hover:border-[rgba(200,60,78,0.26)] hover:bg-white hover:shadow-[0_8px_24px_rgba(74,49,60,0.06)] hover:-translate-y-0.5",
          "active:translate-y-[1px]"
        )}
      >
        <span
          className={cn(
            "absolute w-[76px] h-[76px] rounded-full -right-[25px] -bottom-[34px]",
            "bg-[rgba(200,60,78,0.04)] transition-transform duration-200"
          )}
        />
        <span className="w-10 h-10 grid place-items-center rounded-[13px] text-accent-deep bg-accent-soft flex-none relative z-1">
          <Icon className="w-[21px] h-[21px]" />
        </span>
        <b className="text-sm whitespace-nowrap relative z-1">{name}</b>
      </button>
    )
  }

  // Row variant (for tools page if needed later)
  return (
    <button
      type="button"
      onClick={() => onClick?.(name)}
      className={cn(
        "p-[17px] bg-white/84 border border-line rounded-[18px]",
        "flex items-center gap-[13px]",
        "transition-[background,border-color,box-shadow,transform] duration-150",
        "hover:bg-white hover:border-[rgba(200,60,78,0.20)] hover:shadow-[0_8px_24px_rgba(74,49,60,0.06)] hover:-translate-y-0.5"
      )}
    >
      <span className="w-[43px] h-[43px] grid place-items-center rounded-[13px] text-accent-deep bg-accent-soft flex-none">
        <Icon className="w-[21px] h-[21px]" />
      </span>
      <span className="text-sm font-[620]">{name}</span>
      <ArrowRight className="w-4 h-4 ml-auto text-subtle" />
    </button>
  )
}
