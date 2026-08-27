"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 美化的风格模板下拉菜单(自定义触发框 + 弹出列表)。
 * 复用于"快速写作"与"模板写作"的基础信息步骤。
 */
export function StyleSelect({
  value, options, onChange,
}: {
  value: string
  options: { id: string; name: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((t) => t.id === value)
  const placeholder = "不指定风格"

  // outside-click / ESC 关闭
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [open])

  const choose = (id: string) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      {/* 触发框 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full h-9 pl-4 pr-3 border border-line rounded-4xl text-sm cursor-pointer",
          "flex items-center justify-between gap-2",
          "bg-white/60 text-foreground",
          "transition-[border-color,box-shadow,background] duration-150",
          open
            ? "border-[rgba(200,60,78,0.36)] ring-2 ring-[rgba(200,60,78,0.08)] bg-white"
            : "hover:bg-white/80",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn("truncate", !selected && "text-subtle")}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 flex-none text-muted-text transition-transform duration-150",
            open && "rotate-180 text-accent-deep",
          )}
        />
      </button>

      {/* 弹出列表 */}
      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 left-0 right-0 mt-1.5",
            "max-h-[240px] overflow-y-auto overscroll-contain",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "bg-background border border-line rounded-2xl py-1.5",
            "shadow-[0_12px_32px_rgba(74,49,60,0.14)]",
          )}
        >
          <button
            type="button"
            onClick={() => choose("")}
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3.5 py-2 text-left text-sm cursor-pointer",
              "transition-[background,color] duration-100",
              value === ""
                ? "text-accent-deep bg-accent-soft/70 font-[620]"
                : "text-muted-text hover:bg-accent-soft/40 hover:text-accent-deep",
            )}
          >
            <span>{placeholder}</span>
            {value === "" && <Check className="w-4 h-4 text-accent-deep flex-none" />}
          </button>

          {options.map((t) => {
            const active = t.id === value
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => choose(t.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3.5 py-2 text-left text-sm cursor-pointer",
                  "transition-[background,color] duration-100",
                  active
                    ? "text-accent-deep bg-accent-soft/70 font-[620]"
                    : "text-foreground hover:bg-accent-soft/40 hover:text-accent-deep",
                )}
              >
                <span className="truncate">{t.name}</span>
                {active && <Check className="w-4 h-4 text-accent-deep flex-none" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
