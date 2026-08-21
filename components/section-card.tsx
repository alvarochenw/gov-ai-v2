"use client"

import { useRef, useState } from "react"
import { ChevronUp, ChevronDown, Plus, CornerUpLeft, CornerDownRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { parsePlaceholders } from "@/lib/placeholder"
import type { TemplateSection, SectionWritingMode } from "@/data/template"
import type { ReferenceFile } from "@/lib/template-data"
import type { KnowledgeFile } from "@/types"
import { ReferenceFilesEditor } from "@/components/reference-files-editor"
import { ConfirmDialog } from "@/components/confirm-dialog"

export function validateSectionWordRange(section: TemplateSection): boolean {
  if (section.wordCountMin != null && section.wordCountMax != null) {
    return section.wordCountMin <= section.wordCountMax
  }
  return true
}

/** Generation content must be non-empty for the active writing mode. */
export function validateSectionWritingContent(section: TemplateSection): boolean {
  if (section.writingMode === "fill") {
    return section.fillTemplate.trim().length > 0
  }
  return section.generationHint.trim().length > 0
}

export function SectionCard({
  section,
  readOnly = false,
  numberLabel,
  canMoveUp,
  canMoveDown,
  canDemote = false,
  onUpdate,
  onRemove,
  onMove,
  onAddSubsection,
  onPromoteSection,
  onDemoteSection,
  knowledgeFiles = [],
}: {
  section: TemplateSection
  readOnly?: boolean
  numberLabel: string
  canMoveUp: boolean
  canMoveDown: boolean
  canDemote?: boolean
  onUpdate: (id: string, patch: Partial<TemplateSection>) => void
  onRemove: (id: string) => void
  onMove: (id: string, direction: "up" | "down") => void
  onAddSubsection?: (parentId: string) => void
  onPromoteSection?: (id: string) => void
  onDemoteSection?: (id: string) => void
  knowledgeFiles?: KnowledgeFile[]
}) {
  const fillRef = useRef<HTMLTextAreaElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const wordRangeValid = validateSectionWordRange(section)
  const isSub = section.level === 2
  const placeholders = section.writingMode === "fill" ? parsePlaceholders(section.fillTemplate) : []

  const setMode = (mode: SectionWritingMode) => {
    if (!readOnly) onUpdate(section.id, { writingMode: mode })
  }

  const updateReferenceFiles = (files: ReferenceFile[]) => onUpdate(section.id, { referenceFiles: files })

  /** Insert {{}} at the textarea caret (or append), then place caret between the braces. */
  const insertPlaceholder = () => {
    if (readOnly) return
    const ta = fillRef.current
    const text = section.fillTemplate
    if (!ta) {
      onUpdate(section.id, { fillTemplate: text + "{{}}" })
      return
    }
    const start = ta.selectionStart ?? text.length
    const end = ta.selectionEnd ?? text.length
    const next = text.slice(0, start) + "{{}}" + text.slice(end)
    onUpdate(section.id, { fillTemplate: next })
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + 2 // between {{ and }}
      ta.setSelectionRange(pos, pos)
    })
  }

  return (
    <div
      className={cn(
        "relative border rounded-xl p-4",
        isSub
          ? "ml-6 bg-muted/25 border-line"
          : "bg-white border-line shadow-sm"
      )}
    >
      {/* ---- Title row ---- */}
      <div className="flex items-center gap-2">
        {/* reorder */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={readOnly || !canMoveUp}
            onClick={() => onMove(section.id, "up")}
            className={cn(
              "w-7 h-7 rounded-lg border border-line bg-white/60 hover:bg-white/80 grid place-items-center",
              "transition-[background,opacity] duration-150",
              readOnly || !canMoveUp ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={readOnly || !canMoveDown}
            onClick={() => onMove(section.id, "down")}
            className={cn(
              "w-7 h-7 rounded-lg border border-line bg-white/60 hover:bg-white/80 grid place-items-center",
              "transition-[background,opacity] duration-150",
              readOnly || !canMoveDown ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* section number — level-1 uses a filled badge, level-2 uses plain muted text */}
        {isSub ? (
          <span className="text-xs font-[680] text-muted-text w-8 text-center flex-none">{numberLabel}</span>
        ) : (
          <span className="w-6 h-6 rounded-full bg-accent-soft text-accent-deep text-[11px] font-[680] grid place-items-center flex-none">
            {numberLabel}
          </span>
        )}
        <span className="text-accent-deep text-sm font-[680] -ml-1.5 flex-none" aria-hidden>*</span>

        {/* title input */}
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdate(section.id, { title: e.target.value })}
          placeholder={isSub ? "二级标题" : "章节标题"}
          disabled={readOnly}
          className={cn(
            "flex-1 min-w-0 px-3 border rounded-lg",
            "bg-white/60 text-foreground placeholder:text-subtle",
            "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
            "transition-[border-color,box-shadow] duration-150",
            isSub ? "h-8 text-[13px] font-[580]" : "h-9 text-sm font-[680]",
            readOnly && "bg-muted/30 cursor-not-allowed"
          )}
        />

        {/* delete (X) — opens a confirm dialog */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="w-7 h-7 rounded-lg grid place-items-center text-muted-text hover:text-accent-deep hover:bg-white/60 cursor-pointer transition-[color,background] duration-150 flex-none"
            title={isSub ? "删除二级标题" : "删除章节（含其二级标题）"}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ---- Writing mode toggle + level conversion ---- */}
      <div className="flex items-center gap-2 mt-2 ml-[52px] flex-wrap">
        <span className="text-accent-deep text-sm font-[680] flex-none" aria-hidden>*</span>
        <div className="flex gap-0.5 flex-none">
          <button
            type="button"
            onClick={() => setMode("prompt")}
            disabled={readOnly}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-[620] transition-[background,color] duration-150",
              readOnly ? "cursor-not-allowed" : "cursor-pointer",
              section.writingMode === "prompt"
                ? "bg-accent-soft text-accent-deep"
                : "bg-transparent text-muted-text hover:bg-white/60"
            )}
          >
            提示词
          </button>
          <button
            type="button"
            onClick={() => setMode("fill")}
            disabled={readOnly}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-[620] transition-[background,color] duration-150",
              readOnly ? "cursor-not-allowed" : "cursor-pointer",
              section.writingMode === "fill"
                ? "bg-accent-soft text-accent-deep"
                : "bg-transparent text-muted-text hover:bg-white/60"
            )}
          >
            文本+占位符
          </button>
        </div>

        {/* level conversion: sub → top, or top → sub */}
        {!readOnly && isSub && onPromoteSection && (
          <button
            type="button"
            onClick={() => onPromoteSection(section.id)}
            className="inline-flex items-center gap-1 text-[11px] font-[620] text-muted-text hover:text-accent-deep cursor-pointer border-0 bg-transparent transition-colors duration-150"
            title="转为一级标题"
          >
            <CornerUpLeft className="w-3 h-3" /> 转为一级标题
          </button>
        )}
        {!readOnly && !isSub && onDemoteSection && (
          <button
            type="button"
            onClick={() => onDemoteSection(section.id)}
            disabled={!canDemote}
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-[620] border-0 bg-transparent transition-colors duration-150",
              canDemote
                ? "text-muted-text hover:text-accent-deep cursor-pointer"
                : "text-subtle/50 cursor-not-allowed"
            )}
            title={canDemote ? "转为下方一级标题的首个二级标题" : "下方没有一级标题，无法转换"}
          >
            <CornerDownRight className="w-3 h-3" /> 转为二级标题
          </button>
        )}
      </div>

      {/* ---- Generation content (prompt / fill) ---- */}
      <div className="mt-2 ml-[52px]">
        {section.writingMode === "prompt" ? (
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
        ) : (
          <div>
            <textarea
              ref={fillRef}
              value={section.fillTemplate}
              onChange={(e) => onUpdate(section.id, { fillTemplate: e.target.value })}
              placeholder={"输入文本，用 {{占位符}} 标记待 AI 填充的内容；如为固定文本，则无需添加占位符"}
              rows={2}
              disabled={readOnly}
              className={cn(
                "w-full min-h-[48px] border border-line rounded-lg p-2 text-sm resize-y",
                "bg-white/60 text-foreground placeholder:text-subtle",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                "transition-[border-color,box-shadow] duration-150",
                readOnly && "bg-muted/30 cursor-not-allowed resize-none"
              )}
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {!readOnly && (
                <button
                  type="button"
                  onClick={insertPlaceholder}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-accent-soft text-accent-deep text-[11px] font-[620] bg-accent-faint hover:bg-accent-soft/60 cursor-pointer transition-[background] duration-150"
                  title="在光标处插入占位符 {{}}"
                >
                  <Plus className="w-3 h-3" /> 插入占位符
                </button>
              )}
              {placeholders.length > 0 && (
                <>
                  <span className="text-[10px] text-subtle">已识别：</span>
                  {placeholders.map((p) => (
                    <span
                      key={p}
                      className="px-1.5 py-0.5 rounded-full bg-accent-faint text-accent-deep text-[11px] font-[620]"
                    >
                      {p}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
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
        {!wordRangeValid && <span className="text-xs text-accent-deep">最小不能大于最大</span>}
      </div>

      {/* ---- Reference docs (level-1 only) ---- */}
      {!isSub && (
        <div className="mt-2 ml-[52px]">
          <ReferenceFilesEditor
            files={section.referenceFiles ?? []}
            readOnly={readOnly}
            onChange={updateReferenceFiles}
            knowledgeFiles={knowledgeFiles}
          />
        </div>
      )}

      {/* ---- Add subsection (level-1 only) ---- */}
      {!isSub && !readOnly && onAddSubsection && (
        <div className="mt-2 ml-[52px]">
          <button
            type="button"
            onClick={() => onAddSubsection(section.id)}
            className="inline-flex items-center gap-1.5 text-xs font-[620] text-muted-text hover:text-accent-deep cursor-pointer border-0 bg-transparent hover:underline transition-colors duration-150"
          >
            <Plus className="w-3.5 h-3.5" /> 添加二级标题
          </button>
        </div>
      )}

      {/* ---- Delete confirm dialog ---- */}
      {!readOnly && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={isSub ? "删除二级标题" : "删除一级标题"}
          description={
            isSub
              ? "确定删除这个二级标题吗？该操作不可撤销。"
              : "删除该一级标题将同时删除其下所有二级标题，且操作不可撤销。确定删除吗？"
          }
          confirmLabel="删除"
          cancelLabel="取消"
          variant="destructive"
          onConfirm={() => onRemove(section.id)}
        />
      )}
    </div>
  )
}
