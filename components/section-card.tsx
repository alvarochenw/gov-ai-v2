"use client"

import { ChevronUp, ChevronDown, Lock, Unlock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TemplateSection } from "@/data/template"

export function validateSectionWordRange(section: TemplateSection): boolean {
  if (section.wordCountMin != null && section.wordCountMax != null) {
    return section.wordCountMin <= section.wordCountMax
  }
  return true
}

export function SectionCard({
  section,
  index,
  total,
  readOnly = false,
  onUpdate,
  onRemove,
  onMove,
}: {
  section: TemplateSection
  index: number
  total: number
  readOnly?: boolean
  onUpdate: (id: string, patch: Partial<TemplateSection>) => void
  onRemove: (id: string) => void
  onMove: (id: string, direction: "up" | "down") => void
}) {
  const wordRangeValid = validateSectionWordRange(section)

  return (
    <div className="relative bg-white/60 border border-line rounded-xl p-4">
      {/* ---- Title row ---- */}
      <div className="flex items-center gap-2">
        {/* reorder */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={readOnly || index === 0}
            onClick={() => onMove(section.id, "up")}
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
            onClick={() => onMove(section.id, "down")}
            className={cn(
              "w-7 h-7 rounded-lg border border-line bg-white/60 hover:bg-white/80 grid place-items-center",
              "transition-[background,opacity] duration-150",
              (readOnly || index === total - 1) ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* section number */}
        <span className="text-sm font-[680] text-muted-text w-5 text-center flex-none">{index + 1}</span>

        {/* title input */}
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdate(section.id, { title: e.target.value })}
          placeholder="章节标题"
          disabled={readOnly || section.fixedTitle}
          className={cn(
            "flex-1 h-8 px-3 border rounded-lg text-sm",
            "bg-white/60 text-foreground placeholder:text-subtle",
            "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
            "transition-[border-color,box-shadow] duration-150",
            (readOnly || section.fixedTitle) && "bg-muted/30 cursor-not-allowed",
            !readOnly && !section.fixedTitle && section.title.trim().length === 0 && "border-destructive"
          )}
        />

        {/* lock/unlock button */}
        <button
          type="button"
          onClick={() => !readOnly && onUpdate(section.id, { fixedTitle: !section.fixedTitle })}
          disabled={readOnly}
          className={cn(
            "w-7 h-7 rounded-lg hover:bg-white/60 grid place-items-center",
            "transition-[background] duration-150",
            readOnly ? "text-muted-text/40 cursor-not-allowed" : "cursor-pointer",
            section.fixedTitle ? "text-accent-deep" : "text-muted-text"
          )}
          title={section.fixedTitle ? "点击解锁标题" : "点击锁定标题"}
        >
          {section.fixedTitle ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        {/* required / optional toggle */}
        <div className="flex gap-0.5 flex-none">
          <button
            type="button"
            onClick={() => !readOnly && onUpdate(section.id, { required: true })}
            disabled={readOnly}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-[620] transition-[background,color] duration-150",
              readOnly ? "cursor-not-allowed" : "cursor-pointer",
              section.required
                ? "bg-accent-soft text-accent-deep"
                : "bg-transparent text-muted-text hover:bg-white/60"
            )}
          >
            必填
          </button>
          <button
            type="button"
            onClick={() => !readOnly && onUpdate(section.id, { required: false })}
            disabled={readOnly}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-[620] transition-[background,color] duration-150",
              readOnly ? "cursor-not-allowed" : "cursor-pointer",
              !section.required
                ? "bg-accent-soft text-accent-deep"
                : "bg-transparent text-muted-text hover:bg-white/60"
            )}
          >
            可选
          </button>
        </div>
      </div>

      {/* ---- Generation hint ---- */}
      <div className="mt-2 ml-[52px]">
        <textarea
          value={section.generationHint}
          onChange={(e) => onUpdate(section.id, { generationHint: e.target.value })}
          placeholder="描述本章节的生成要求..."
          rows={1}
          disabled={readOnly}
          className={cn(
            "w-full min-h-[32px] border border-line rounded-lg p-2 text-sm resize-y",
            "bg-white/60 text-foreground placeholder:text-subtle",
            "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
            "transition-[border-color,box-shadow] duration-150",
            readOnly && "bg-muted/30 cursor-not-allowed resize-none"
          )}
        />
      </div>

      {/* ---- Word count range ---- */}
      <div className="flex items-center gap-2 mt-2 ml-[52px]">
        <label className="text-xs font-[620] text-muted-text flex-none">篇幅</label>
        <input
          type="number"
          min={0}
          value={section.wordCountMin ?? ""}
          onChange={(e) =>
            onUpdate(section.id, { wordCountMin: e.target.value ? Number(e.target.value) : null })
          }
          placeholder="最少"
          disabled={readOnly}
          className={cn(
            "w-20 h-7 px-2 border border-line rounded-lg text-sm text-center bg-white/60",
            "focus:outline-none focus:border-[rgba(200,60,78,0.36)] transition-[border-color] duration-150",
            readOnly && "bg-muted/30 cursor-not-allowed"
          )}
        />
        <span className="text-xs text-muted-text">-</span>
        <input
          type="number"
          min={0}
          value={section.wordCountMax ?? ""}
          onChange={(e) =>
            onUpdate(section.id, { wordCountMax: e.target.value ? Number(e.target.value) : null })
          }
          placeholder="最多"
          disabled={readOnly}
          className={cn(
            "w-20 h-7 px-2 border border-line rounded-lg text-sm text-center bg-white/60",
            "focus:outline-none focus:border-[rgba(200,60,78,0.36)] transition-[border-color] duration-150",
            readOnly && "bg-muted/30 cursor-not-allowed"
          )}
        />
        <span className="text-xs text-muted-text">字</span>
        {!wordRangeValid && (
          <span className="text-xs text-accent-deep">最小不能大于最大</span>
        )}
      </div>

      {/* ---- Delete button ---- */}
      {!readOnly && (
        <button
          type="button"
          onClick={() => onRemove(section.id)}
          className="absolute top-3 right-3 w-6 h-6 rounded-lg grid place-items-center text-muted-text hover:text-accent-deep hover:bg-white/60 cursor-pointer transition-[color,background] duration-150"
          title="删除章节"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
