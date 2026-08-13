"use client"

import { ChevronUp, ChevronDown, Lock, Unlock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StyleDimension } from "@/data/style"

export function DimensionCard({
  dimension,
  index,
  total,
  readOnly = false,
  onUpdate,
  onRemove,
  onMove,
}: {
  dimension: StyleDimension
  index: number
  total: number
  readOnly?: boolean
  onUpdate: (id: string, patch: Partial<StyleDimension>) => void
  onRemove: (id: string) => void
  onMove: (id: string, direction: "up" | "down") => void
}) {
  return (
    <div className="relative bg-white/60 border border-line rounded-xl p-4">
      {/* ---- Main row ---- */}
      <div className="flex items-center gap-2">
        {/* reorder */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={readOnly || index === 0}
            onClick={() => onMove(dimension.id, "up")}
            className={cn(
              "w-7 h-7 rounded-lg border border-line bg-white/60 hover:bg-white/80 grid place-items-center",
              "transition-[background,opacity] duration-150",
              (readOnly || index === 0) ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={readOnly || index === total - 1}
            onClick={() => onMove(dimension.id, "down")}
            className={cn(
              "w-7 h-7 rounded-lg border border-line bg-white/60 hover:bg-white/80 grid place-items-center",
              "transition-[background,opacity] duration-150",
              (readOnly || index === total - 1) ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* index */}
        <span className="text-sm font-[680] text-muted-text w-5 text-center flex-none">{index + 1}</span>

        {/* dimension name input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <label className="text-xs font-[620] text-muted-text flex-none">维度</label>
          <input
            type="text"
            value={dimension.name}
            onChange={(e) => onUpdate(dimension.id, { name: e.target.value })}
            placeholder="如：语气风格"
            disabled={readOnly || dimension.fixedName}
            className={cn(
              "flex-1 min-w-0 h-8 px-3 border rounded-lg text-sm",
              "bg-white/60 text-foreground placeholder:text-subtle",
              "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow] duration-150",
              (readOnly || dimension.fixedName) && "bg-muted/30 cursor-not-allowed",
              !readOnly && !dimension.fixedName && dimension.name.trim().length === 0 && "border-destructive"
            )}
          />
          {/* lock/unlock */}
          <button
            type="button"
            onClick={() => !readOnly && onUpdate(dimension.id, { fixedName: !dimension.fixedName })}
            disabled={readOnly}
            className={cn(
              "w-7 h-7 rounded-lg hover:bg-white/60 grid place-items-center",
              "transition-[background] duration-150",
              readOnly ? "text-muted-text/40 cursor-not-allowed" : "cursor-pointer",
              dimension.fixedName ? "text-accent-deep" : "text-muted-text"
            )}
            title={dimension.fixedName ? "点击解锁维度名" : "点击锁定维度名"}
          >
            {dimension.fixedName ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* dimension value input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <label className="text-xs font-[620] text-muted-text flex-none">值</label>
          <input
            type="text"
            value={dimension.value}
            onChange={(e) => onUpdate(dimension.id, { value: e.target.value })}
            placeholder="如：严肃正式"
            disabled={readOnly}
            className={cn(
              "flex-1 min-w-0 h-8 px-3 border rounded-lg text-sm",
              "bg-white/60 text-foreground placeholder:text-subtle",
              "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow] duration-150",
              readOnly && "bg-muted/30 cursor-not-allowed",
              !readOnly && dimension.value.trim().length === 0 && "border-destructive"
            )}
          />
        </div>

        {/* required / optional toggle */}
        <div className="flex gap-0.5 flex-none">
          <button
            type="button"
            onClick={() => !readOnly && onUpdate(dimension.id, { required: true })}
            disabled={readOnly}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-[620] transition-[background,color] duration-150",
              readOnly ? "cursor-not-allowed" : "cursor-pointer",
              dimension.required
                ? "bg-accent-soft text-accent-deep"
                : "bg-transparent text-muted-text hover:bg-white/60"
            )}
          >
            必填
          </button>
          <button
            type="button"
            onClick={() => !readOnly && onUpdate(dimension.id, { required: false })}
            disabled={readOnly}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-[620] transition-[background,color] duration-150",
              readOnly ? "cursor-not-allowed" : "cursor-pointer",
              !dimension.required
                ? "bg-accent-soft text-accent-deep"
                : "bg-transparent text-muted-text hover:bg-white/60"
            )}
          >
            可选
          </button>
        </div>
      </div>

      {/* ---- Delete button ---- */}
      {!readOnly && (
        <button
          type="button"
          onClick={() => onRemove(dimension.id)}
          className="absolute top-3 right-3 w-6 h-6 rounded-lg grid place-items-center text-muted-text hover:text-accent-deep hover:bg-white/60 cursor-pointer transition-[color,background] duration-150"
          title="删除维度"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
