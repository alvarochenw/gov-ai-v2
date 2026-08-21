"use client"

import { useState } from "react"
import { Palette, Eye, Copy, Pin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/confirm-dialog"
import type { StyleTemplate } from "@/data/style"

const MAX_PINNED = 3

interface StyleLibraryCardProps {
  template: StyleTemplate
  isPinned: boolean
  pinnedCount: number
  onView: (template: StyleTemplate) => void
  onCopy: (template: StyleTemplate) => void
  onPin: (template: StyleTemplate) => void
  onUnpin: (template: StyleTemplate) => void
  onDelete?: (template: StyleTemplate) => void
}

const sourceLabel: Record<string, string> = {
  file: "文件提取",
  custom: "自定义",
}

export function StyleLibraryCard({
  template,
  isPinned,
  pinnedCount,
  onView,
  onCopy,
  onPin,
  onUnpin,
  onDelete,
}: StyleLibraryCardProps) {
  const isPreset = template.id.startsWith("preset-")

  const [confirmPinOpen, setConfirmPinOpen] = useState(false)
  const [pinLimitOpen, setPinLimitOpen] = useState(false)

  const handlePinClick = () => {
    if (isPinned) {
      onUnpin(template)
    } else if (pinnedCount >= MAX_PINNED) {
      setPinLimitOpen(true)
    } else {
      setConfirmPinOpen(true)
    }
  }

  return (
    <article
      className={cn(
        "relative p-[19px] bg-white/84 border rounded-[18px]",
        "transition-[transform,box-shadow] duration-200",
        "hover:shadow-[0_8px_28px_rgba(74,49,60,0.08)] hover:scale-[1.004]",
        isPinned ? "border-[rgba(200,60,78,0.22)]" : "border-line"
      )}
    >
      {/* Delete button — top-right, non-preset only */}
      {!isPreset && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(template)}
          className="absolute top-3 right-3 w-6 h-6 rounded-lg grid place-items-center text-muted-text hover:text-accent-deep hover:bg-white/60 cursor-pointer transition-[color,background] duration-150"
          title="删除模板"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-start gap-3 mb-3">
        <span className="w-[42px] h-[42px] grid place-items-center rounded-xl bg-accent-faint text-accent-deep flex-none">
          <Palette className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-[#2c1810] truncate">{template.name}</h3>
            {isPinned && (
              <Pin className="w-3 h-3 text-primary/60 flex-none" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-text">
              {template.styleSpec.documentType || template.styleSpec.direction
                ? `${template.styleSpec.documentType || "自定义"}${template.styleSpec.direction ? " · " + template.styleSpec.direction : ""}`
                : "自定义风格"}
            </span>
            {template.writingRequirements.length > 0 && (
              <span className="text-[10px] text-subtle flex-none">
                {template.writingRequirements.length} 条要求
              </span>
            )}
            <span className={cn(
              "text-[9px] font-[660] px-1.5 py-0.5 rounded flex-none",
              isPreset ? "bg-primary/10 text-primary" : "bg-accent-soft text-accent-deep"
            )}>
              {isPreset ? "预设" : sourceLabel[template.source] || "自定义"}
            </span>
          </div>
        </div>
      </div>

      {/* Action row — matches ExpertCard style */}
      <div className="flex items-center gap-2">
        {/* Copy icon button */}
        <button
          type="button"
          onClick={() => onCopy(template)}
          className={cn(
            "h-9 w-9 grid place-items-center rounded-lg border",
            "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer",
            "transition-[background,border-color,color] duration-150"
          )}
          title="复制"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Pin icon button */}
        <button
          type="button"
          onClick={handlePinClick}
          className={cn(
            "h-9 w-9 grid place-items-center rounded-lg border",
            "transition-[background,border-color,color] duration-150",
            isPinned
              ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
              : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
          )}
          title={isPinned ? "取消置顶" : "置顶"}
        >
          <Pin className={cn("w-4 h-4", isPinned && "fill-current")} />
        </button>

        {/* View button — flex-1 like ExpertCard's "立即使用" */}
        <button
          type="button"
          onClick={() => onView(template)}
          className={cn(
            "flex-1 py-[9px] rounded-xl text-[13px] font-[660] border",
            "flex items-center justify-center gap-2",
            "border-border bg-background hover:bg-accent hover:border-[rgba(200,60,78,0.24)] hover:shadow-[0_4px_16px_rgba(84,56,68,0.06)]",
            "transition-[background,border-color,box-shadow] duration-150 cursor-pointer"
          )}
        >
          <Eye className="w-[18px] h-[18px]" />
          查看
        </button>
      </div>

      {/* Confirm: pin */}
      <ConfirmDialog
        open={confirmPinOpen}
        onOpenChange={setConfirmPinOpen}
        title="置顶风格模板"
        description={`是否置顶「${template.name}」？置顶后将始终显示在列表顶部。`}
        confirmLabel="置顶"
        onConfirm={() => onPin(template)}
      />

      {/* Notice: pin limit reached */}
      <ConfirmDialog
        open={pinLimitOpen}
        onOpenChange={setPinLimitOpen}
        title="置顶数量已达上限"
        description={`最多可置顶 ${MAX_PINNED} 个模板。请先取消其他模板的置顶，再重新操作。`}
        confirmLabel="我知道了"
        hideCancel
        onConfirm={() => {}}
      />
    </article>
  )
}
