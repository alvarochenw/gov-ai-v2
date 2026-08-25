"use client"

import type { LucideIcon } from "lucide-react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type WriteModeId = "full" | "outline" | "outline-to-full"

interface WriteModeCardProps {
  id: WriteModeId
  name: string
  description: string
  icon: LucideIcon
  /** 大卡片(突出版):用于品字型顶部「生成全文」。 */
  featured?: boolean
  selected?: boolean
  onClick: (id: WriteModeId) => void
}

export function WriteModeCard({
  id,
  name,
  description,
  icon: Icon,
  featured = false,
  selected = false,
  onClick,
}: WriteModeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      aria-pressed={selected}
      className={cn(
        "relative overflow-hidden text-left cursor-pointer bg-white/80 border border-line w-full",
        "flex items-center gap-4",
        "transition-[border-color,background,transform,box-shadow] duration-150",
        "active:translate-y-[1px]",
        featured
          ? "min-h-[132px] rounded-[20px] p-7 gap-6"
          : "min-h-[88px] rounded-[18px] p-[17px]",
        selected
          ? "border-[rgba(200,60,78,0.26)] bg-white -translate-y-0.5 shadow-[0_12px_32px_rgba(74,49,60,0.10)]"
          : "hover:border-[rgba(200,60,78,0.26)] hover:bg-white hover:shadow-[0_8px_24px_rgba(74,49,60,0.06)] hover:-translate-y-0.5"
      )}
    >
      {/* Decorative circle */}
      <span
        className={cn(
          "absolute rounded-full -right-[25px] -bottom-[34px] bg-[rgba(200,60,78,0.04)] transition-transform duration-200",
          featured ? "w-[110px] h-[110px]" : "w-[76px] h-[76px]",
          selected && "scale-[1.45]"
        )}
      />

      {/* 推荐角标(仅 featured) */}
      {featured && (
        <span className="absolute top-4 right-4 z-2 px-2 py-0.5 rounded-full bg-accent-soft text-accent-deep text-[10px] font-[700] tracking-wide">
          推荐
        </span>
      )}

      {/* 选中勾选 */}
      {selected && (
        <CheckCircle2 className="absolute z-2 text-accent-deep w-5 h-5" style={{ top: featured ? 16 : 12, right: featured ? 64 : 12 }} />
      )}

      {/* 图标槽 */}
      <span
        className={cn(
          "grid place-items-center relative z-1 flex-none",
          featured
            ? "w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#d85061] to-[#aa2639] text-white shadow-[0_8px_18px_rgba(170,38,57,0.20)]"
            : "w-10 h-10 rounded-[13px] text-accent-deep bg-accent-soft"
        )}
      >
        <Icon className={featured ? "w-7 h-7" : "w-[21px] h-[21px]"} />
      </span>

      {/* 文案 */}
      <div className="min-w-0 relative z-1">
        <b className={cn("block", featured ? "text-base font-[680]" : "text-sm")}>{name}</b>
        <small className="block mt-1 text-muted-text leading-[1.55] text-[11px]">
          {description}
        </small>
      </div>
    </button>
  )
}
