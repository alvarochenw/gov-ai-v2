"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { sceneCategories } from "@/data/scenes"
import type { SceneSubItem } from "@/data/scenes"

interface ScenePickerProps {
  selected: SceneSubItem | null
  onSelect: (s: SceneSubItem) => void
}

export function ScenePicker({ selected, onSelect }: ScenePickerProps) {
  // 当前选中的文种卡片(用于展开其细分场景)
  const [activeCatId, setActiveCatId] = useState<string | null>(
    selected ? sceneCategories.find((c) => c.scenes.some((s) => s.id === selected.id))?.id ?? null : null
  )

  const activeCat = activeCatId ? sceneCategories.find((c) => c.id === activeCatId) : null

  const handleCardClick = (catId: string) => {
    setActiveCatId((prev) => (prev === catId ? null : catId))
  }

  return (
    <div className="space-y-4">
      {/* 文种网格(4 列,扁平,选中淡粉高亮) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sceneCategories.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCatId === cat.id
          const hasSelectedChild = selected && cat.scenes.some((s) => s.id === selected.id)
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCardClick(cat.id)}
              className={cn(
                "flex items-center gap-2.5 p-3.5 rounded-[14px] border text-left cursor-pointer",
                "transition-[border-color,background,box-shadow,transform] duration-150",
                isActive
                  ? "border-[rgba(200,60,78,0.22)] bg-[#fff5f6] shadow-[0_6px_18px_rgba(74,49,60,0.06)]"
                  : "border-line bg-white/70 hover:border-[rgba(200,60,78,0.20)] hover:bg-white"
              )}
            >
              <span className={cn(
                "w-8 h-8 grid place-items-center rounded-[10px] flex-none",
                isActive ? "bg-accent-soft text-accent-deep" : "bg-muted/40 text-muted-text"
              )}>
                <Icon className="w-[17px] h-[17px]" />
              </span>
              <div className="min-w-0 flex-1">
                <b className="block text-[13px] font-[660] text-foreground truncate">{cat.name}</b>
                <span className="text-[10px] text-subtle">{cat.scenes.length}个场景</span>
              </div>
              {hasSelectedChild && (
                <CheckCircle2 className="w-4 h-4 text-accent-deep flex-none" />
              )}
            </button>
          )
        })}
      </div>

      {/* 当前文种的细分场景(展开时) */}
      {activeCat && (
        <div className="bg-white/80 border border-line rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 grid place-items-center rounded-lg bg-accent-soft text-accent-deep">
              <activeCat.icon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-[660] text-foreground">{activeCat.name} · 细分场景</h4>
            <span className="text-[11px] text-subtle">选择一个具体场景</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeCat.scenes.map((sub) => {
              const isSel = selected?.id === sub.id
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelect(sub)}
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-xl text-left border cursor-pointer",
                    "transition-[border-color,background,box-shadow] duration-150",
                    isSel
                      ? "border-[rgba(200,60,78,0.26)] bg-accent-faint shadow-[0_6px_18px_rgba(74,49,60,0.06)]"
                      : "border-line bg-white/60 hover:border-[rgba(200,60,78,0.20)] hover:bg-white"
                  )}
                >
                  <span className={cn(
                    "w-2 h-2 mt-1.5 rounded-full flex-none",
                    isSel ? "bg-accent-deep" : "bg-muted"
                  )} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-[620] text-foreground truncate">{sub.name}</span>
                      <span className="text-[10px] font-[620] px-1.5 py-0.5 rounded bg-accent-soft text-accent-deep flex-none">
                        {sub.documentType}
                      </span>
                    </div>
                    {sub.description && (
                      <p className="mt-0.5 text-[11px] text-muted-text leading-[1.5] line-clamp-2">{sub.description}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
