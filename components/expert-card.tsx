"use client"

import { useState } from "react"
import { ArrowRight, Pin, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/confirm-dialog"
import type { Expert } from "@/types"

const MAX_PINNED = 3

interface ExpertCardProps {
  expert: Expert
  isSelected: boolean
  isPinned: boolean
  isDefault: boolean
  pinnedCount: number
  onClick: (name: string, prompt: string) => void
  onPin: (name: string) => void
  onUnpin: (name: string) => void
  onSetDefault: (name: string) => void
}

export function ExpertCard({ expert, isSelected, isPinned, isDefault, pinnedCount, onClick, onPin, onUnpin, onSetDefault }: ExpertCardProps) {
  const Icon = expert.icon

  const [confirmPinOpen, setConfirmPinOpen] = useState(false)
  const [confirmDefaultOpen, setConfirmDefaultOpen] = useState(false)
  const [pinLimitOpen, setPinLimitOpen] = useState(false)

  const handlePinClick = () => {
    if (isPinned) {
      // 默认专家不允许取消置顶
      if (isDefault) return
      onUnpin(expert.name)
    } else if (pinnedCount >= MAX_PINNED) {
      // 已达置顶上限，弹出提示
      setPinLimitOpen(true)
    } else {
      setConfirmPinOpen(true)
    }
  }

  const handleSetDefaultClick = () => {
    if (isDefault) return
    setConfirmDefaultOpen(true)
  }

  return (
    <article
      className={cn(
        "p-[19px] bg-white/84 border border-line rounded-[18px]",
        "transition-[transform,box-shadow] duration-200",
        "hover:shadow-[0_8px_28px_rgba(74,49,60,0.08)] hover:scale-[1.004]"
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <span
          className={cn(
            "w-[42px] h-[42px] grid place-items-center rounded-xl flex-none",
            isSelected
              ? "bg-gradient-to-br from-[#d85061] to-[#aa2639] text-white"
              : "bg-accent-faint text-accent-deep"
          )}
        >
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-[#2c1810] truncate">
              {expert.name}
            </h3>
            {isDefault && (
              <span className="text-[9px] font-[660] text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-none">
                默认
              </span>
            )}
            {isPinned && !isDefault && (
              <Pin className="w-3 h-3 text-primary/60 flex-none" />
            )}
          </div>
          <p className="text-xs text-muted-text mt-0.5">{expert.specialty}</p>
        </div>
      </div>

      <p className="text-[13px] text-muted-text leading-relaxed mb-4">
        {expert.description}
      </p>

      {/* Action row */}
      <div className="flex items-center gap-2">
        {/* Set default icon button */}
        <button
          type="button"
          onClick={handleSetDefaultClick}
          disabled={isDefault}
          className={cn(
            "h-9 w-9 grid place-items-center rounded-lg border",
            "transition-[background,border-color,color] duration-150",
            isDefault
              ? "border-primary/20 bg-primary/5 text-primary cursor-default"
              : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
          )}
          title={isDefault ? "当前默认专家" : "设置为默认专家"}
        >
          <Star className={cn("w-4 h-4", isDefault && "fill-primary")} />
        </button>

        {/* Pin icon button */}
        <button
          type="button"
          onClick={handlePinClick}
          disabled={isPinned && isDefault}
          className={cn(
            "h-9 w-9 grid place-items-center rounded-lg border",
            "transition-[background,border-color,color] duration-150",
            isPinned && isDefault
              ? "border-primary/20 bg-primary/5 text-primary/40 cursor-not-allowed"
              : isPinned
                ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
          )}
          title={isPinned && isDefault ? "默认专家不可取消置顶" : isPinned ? "取消置顶" : "置顶"}
        >
          <Pin className={cn("w-4 h-4", isPinned && "fill-current")} />
        </button>

        {/* Use button */}
        <button
          type="button"
          onClick={() => onClick(expert.name, expert.prompt)}
          className={cn(
            "flex-1 py-[9px] rounded-xl text-[13px] font-[660] border",
            "flex items-center justify-center gap-2",
            "transition-[background,border-color,box-shadow] duration-150",
            isSelected
              ? "bg-gradient-to-br from-[#cf4657] to-[#aa2639] border-[#aa2639] text-white shadow-[0_4px_16px_rgba(178,43,62,0.16)]"
              : "border-border bg-background hover:bg-accent hover:border-[rgba(200,60,78,0.24)] hover:shadow-[0_4px_16px_rgba(84,56,68,0.06)]"
          )}
        >
          <ArrowRight className="w-[18px] h-[18px]" />
          立即使用
        </button>
      </div>

      {/* Confirm: pin */}
      <ConfirmDialog
        open={confirmPinOpen}
        onOpenChange={setConfirmPinOpen}
        title="置顶数字专家"
        description={`是否置顶「${expert.name}」？置顶后将始终显示在列表顶部。`}
        confirmLabel="置顶"
        onConfirm={() => onPin(expert.name)}
      />

      {/* Confirm: set default */}
      <ConfirmDialog
        open={confirmDefaultOpen}
        onOpenChange={setConfirmDefaultOpen}
        title="设为默认专家"
        description={`是否将「${expert.name}」设为默认数字专家？设为默认后将自动置顶并排在最前。`}
        confirmLabel="设为默认"
        onConfirm={() => onSetDefault(expert.name)}
      />

      {/* Notice: pin limit reached */}
      <ConfirmDialog
        open={pinLimitOpen}
        onOpenChange={setPinLimitOpen}
        title="置顶数量已达上限"
        description={`最多可置顶 ${MAX_PINNED} 个数字专家。请先取消其他专家的置顶，再重新操作。`}
        confirmLabel="我知道了"
        hideCancel
        onConfirm={() => {}}
      />
    </article>
  )
}
