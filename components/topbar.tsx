"use client"

import {
  Home,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppState, useAppDispatch } from "@/hooks/use-app-state"
import { viewMeta } from "@/data/view-meta"

export function Topbar() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { view } = state
  const meta = viewMeta[view] || viewMeta.home

  return (
    <header
      className={cn(
        "h-[66px] flex-none px-7 flex items-center justify-between",
        "bg-white/78 backdrop-blur-[18px] border-b border-line relative z-2",
        "max-[800px]:px-[14px]"
      )}
    >
      <div className="flex items-center gap-[11px] min-w-0">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_MOBILE_MENU", open: true })}
          className={cn(
            "hidden max-[800px]:grid place-items-center w-[38px] h-[38px] p-0",
            "border border-line rounded-[12px] bg-white cursor-pointer"
          )}
          aria-label="打开导航"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* View icon */}
        <span
          className={cn(
            "w-9 h-9 grid place-items-center rounded-[12px]",
            "text-accent-deep bg-accent-soft",
            "max-[800px]:hidden"
          )}
        >
          <Home className="w-[19px] h-[19px]" />
        </span>

        {/* View title */}
        <span className="min-w-0">
          <span className="block text-sm font-[760] whitespace-nowrap overflow-hidden text-ellipsis">
            {meta.title}
          </span>
          <span className="block mt-[2px] text-subtle text-[10px]">
            {meta.subtitle}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Security badge */}
        <span
          className={cn(
            "text-success bg-[rgba(23,132,94,0.08)] border border-[rgba(23,132,94,0.12)]",
            "rounded-full px-[11px] py-[7px] text-[11px] font-[680]",
            "inline-flex items-center gap-1.5",
            "max-[800px]:hidden"
          )}
        >
          <span className="w-[7px] h-[7px] rounded-full bg-success shadow-[0_0_0_4px_rgba(23,132,94,0.08)]" />
          安全办公，内网可信
        </span>
      </div>
    </header>
  )
}
