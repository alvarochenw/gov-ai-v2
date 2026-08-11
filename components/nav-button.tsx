"use client"

import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ViewName } from "@/types"

interface NavButtonProps {
  viewName: ViewName
  icon: LucideIcon
  label: string
  active: boolean
  hasSubnav?: boolean
  expanded?: boolean
  onClick: () => void
  children?: React.ReactNode
  collapsed?: boolean
}

export function NavButton({
  viewName,
  icon: Icon,
  label,
  active,
  hasSubnav,
  expanded,
  onClick,
  children,
  collapsed,
}: NavButtonProps) {
  return (
    <div className={cn(hasSubnav && "grid gap-[3px]", hasSubnav && expanded && "expanded")}>
      <button
        type="button"
        onClick={onClick}
        title={label}
        className={cn(
          "w-full border-0 cursor-pointer text-left text-inherit",
          "flex items-center transition-[background,color,transform,box-shadow] duration-150",
          "min-h-12 gap-[11px] rounded-[14px] px-[10px] py-[7px] font-[660]",
          active
            ? "bg-white/92 text-accent-deep shadow-[0_8px_24px_rgba(74,49,60,0.06)]"
            : "bg-transparent hover:bg-white/64 active:translate-y-[1px]"
        )}
      >
        <span
          className={cn(
            "w-[34px] h-[34px] grid place-items-center rounded-[11px] flex-none",
            active
              ? "text-white bg-gradient-to-br from-[#d85061] to-[#b22b3e] shadow-[0_8px_18px_rgba(178,43,62,0.18)]"
              : "text-muted-text bg-white/55"
          )}
        >
          <Icon className="w-[19px] h-[19px]" />
        </span>
        {!collapsed && <span>{label}</span>}
        {!collapsed && hasSubnav && (
          <ChevronRight
            className={cn(
              "ml-auto w-4 h-4 text-subtle transition-transform duration-150",
              expanded && "rotate-90"
            )}
          />
        )}
      </button>
      {!collapsed && hasSubnav && expanded && children}
    </div>
  )
}
