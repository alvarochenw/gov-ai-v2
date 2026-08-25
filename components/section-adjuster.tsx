"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { X, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TemplateSection, SectionWritingMode } from "@/data/template"
import { toGroups } from "@/lib/template-writing-engine"
import { parsePlaceholders } from "@/lib/placeholder"

const uid = () => crypto.randomUUID()

interface SectionAdjusterProps {
  templateName: string
  sections: TemplateSection[]
  onChange: (sections: TemplateSection[]) => void
  onClose: () => void
}

/**
 * Per-session section adjuster. Operates on a deep copy supplied by the parent
 * (already cloned in template-write-view). No saveTemplates / localStorage
 * writes — edits apply only to the current writing session and never mutate
 * the preset.
 *
 * Holds the FULL section list (level-1 + level-2) so opening the adjuster
 * never drops sub-headings. Level-1 sections are editable (title, hint, word
 * range, add/remove, reorder with their sub-headings moved along). Level-2
 * sections are editable too (title, hint, word range, add/remove) and render
 * indented under their parent.
 */
export function SectionAdjuster({
  templateName,
  sections,
  onChange,
  onClose,
}: SectionAdjusterProps) {
  const [local, setLocal] = useState<TemplateSection[]>(() => sections.map((s) => ({ ...s })))

  const commit = (next: TemplateSection[]) => {
    setLocal(next)
    onChange(next)
  }

  const update = (id: string, patch: Partial<TemplateSection>) => {
    commit(local.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  /** Remove a level-1 section and all its sub-headings. */
  const removeSection = (parentId: string) => {
    commit(local.filter((s) => s.id !== parentId && s.parentId !== parentId))
  }

  /** Add a new level-1 section at the end. */
  const addSection = () => {
    const s: TemplateSection = {
      id: uid(),
      title: "",
      fixedTitle: false,
      required: true,
      level: 1,
      parentId: null,
      writingMode: "prompt",
      generationHint: "",
      fillTemplate: "",
      referenceFiles: [],
      wordCountMin: null,
      wordCountMax: null,
      order: local.length,
    }
    commit([...local, s])
  }

  /** Move a level-1 group up/down (parent + its sub-headings move together). */
  const moveGroup = (parentIndex: number, dir: -1 | 1) => {
    const groups = toGroups(local)
    const target = parentIndex + dir
    if (target < 0 || target >= groups.length) return
    const reordered = [...groups]
    ;[reordered[parentIndex], reordered[target]] = [reordered[target], reordered[parentIndex]]
    // Flatten back, reassign order.
    commit(reordered.flat().map((s, i) => ({ ...s, order: i })))
  }

  /** Add a new level-2 section at the end of a parent's sub-heading list. */
  const addSubSection = (parentId: string) => {
    const groups = toGroups(local)
    const gi = groups.findIndex((g) => g[0].id === parentId)
    if (gi < 0) return
    const sub: TemplateSection = {
      id: uid(),
      title: "",
      fixedTitle: false,
      required: true,
      level: 2,
      parentId,
      writingMode: "prompt",
      generationHint: "",
      fillTemplate: "",
      referenceFiles: [],
      wordCountMin: null,
      wordCountMax: null,
      order: 0,
    }
    const nextGroups = [...groups.slice(0, gi), [...groups[gi], sub], ...groups.slice(gi + 1)]
    commit(nextGroups.flat().map((s, i) => ({ ...s, order: i })))
  }

  /** Remove a single level-2 section (its parent and siblings stay). */
  const removeSubSection = (id: string) => {
    commit(local.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })))
  }

  const groups = toGroups(local)

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 backdrop-blur-[2px] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-[0_8px_24px_rgba(74,49,60,0.12)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-line">
          <h3 className="text-sm font-[660] flex-1 truncate">
            本次微调 · {templateName}
          </h3>
          <span className="text-[11px] text-muted-text">仅本次有效,不影响模板库</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4 text-muted-text" />
          </button>
        </div>

        {/* List — grouped by level-1 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {groups.length === 0 && (
            <p className="text-xs text-muted-text text-center py-8">
              暂无章节,点击下方添加。
            </p>
          )}
          {groups.map((group, gi) => {
            const parent = group[0]
            const children = group.slice(1)
            return (
              <div key={parent.id} className="rounded-xl border border-line bg-white/70 p-3">
                {/* Parent header row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-[680] text-muted-text w-5 text-center">
                    {gi + 1}
                  </span>
                  <input
                    type="text"
                    value={parent.title}
                    onChange={(e) => update(parent.id, { title: e.target.value })}
                    placeholder="章节标题"
                    className="flex-1 h-8 px-3 text-sm border border-line rounded-lg bg-white/60 focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)] transition-[border-color,box-shadow]"
                  />
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveGroup(gi, -1)}
                      disabled={gi === 0}
                      className="p-1 rounded text-muted-text hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGroup(gi, 1)}
                      disabled={gi === groups.length - 1}
                      className="p-1 rounded text-muted-text hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(parent.id)}
                      className="p-1 rounded text-muted-text hover:text-accent-deep hover:bg-accent-faint/40"
                      title="删除该一级标题(含其二级标题)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Parent: writing mode + content (prompt / fill) */}
                <SectionContentEditor section={parent} onUpdate={update} />

                {/* Parent: word range */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] text-muted-text">字数范围</span>
                  <input
                    type="number"
                    value={parent.wordCountMin ?? ""}
                    onChange={(e) =>
                      update(parent.id, { wordCountMin: e.target.value === "" ? null : Number(e.target.value) })
                    }
                    placeholder="最少"
                    className="w-16 h-7 px-2 text-xs border border-line rounded-lg bg-white/60 focus:outline-none focus:border-[rgba(200,60,78,0.36)]"
                  />
                  <span className="text-[11px] text-subtle">~</span>
                  <input
                    type="number"
                    value={parent.wordCountMax ?? ""}
                    onChange={(e) =>
                      update(parent.id, { wordCountMax: e.target.value === "" ? null : Number(e.target.value) })
                    }
                    placeholder="最多"
                    className="w-16 h-7 px-2 text-xs border border-line rounded-lg bg-white/60 focus:outline-none focus:border-[rgba(200,60,78,0.36)]"
                  />
                  <span className="text-[11px] text-subtle">字</span>
                </div>

                {/* Children (editable, indented) */}
                {children.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-line/60 space-y-2">
                    {children.map((c, ci) => (
                      <div key={c.id} className="ml-6 space-y-1.5">
                        {/* title row */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-[680] text-muted-text w-8 text-center flex-none">
                            {gi + 1}.{ci + 1}
                          </span>
                          <input
                            type="text"
                            value={c.title}
                            onChange={(e) => update(c.id, { title: e.target.value })}
                            placeholder="二级标题"
                            className="flex-1 h-7 px-2.5 text-xs border border-line rounded-lg bg-white/60 focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)] transition-[border-color,box-shadow]"
                          />
                          <button
                            type="button"
                            onClick={() => removeSubSection(c.id)}
                            className="p-1 rounded text-muted-text hover:text-accent-deep hover:bg-accent-faint/40 transition-[color,background]"
                            title="删除该二级标题"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* generation content (prompt / fill) */}
                        <SectionContentEditor section={c} onUpdate={update} compact />
                        {/* word range */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-text">字数范围</span>
                          <input
                            type="number"
                            value={c.wordCountMin ?? ""}
                            onChange={(e) =>
                              update(c.id, { wordCountMin: e.target.value === "" ? null : Number(e.target.value) })
                            }
                            placeholder="最少"
                            className="w-16 h-7 px-2 text-xs border border-line rounded-lg bg-white/60 focus:outline-none focus:border-[rgba(200,60,78,0.36)]"
                          />
                          <span className="text-[11px] text-subtle">~</span>
                          <input
                            type="number"
                            value={c.wordCountMax ?? ""}
                            onChange={(e) =>
                              update(c.id, { wordCountMax: e.target.value === "" ? null : Number(e.target.value) })
                            }
                            placeholder="最多"
                            className="w-16 h-7 px-2 text-xs border border-line rounded-lg bg-white/60 focus:outline-none focus:border-[rgba(200,60,78,0.36)]"
                          />
                          <span className="text-[11px] text-subtle">字</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add a level-2 heading under this parent */}
                <div className="mt-2 ml-6">
                  <button
                    type="button"
                    onClick={() => addSubSection(parent.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-line text-[11px] font-[620] text-muted-text hover:text-foreground hover:border-[rgba(200,60,78,0.36)] hover:bg-accent-faint/40 cursor-pointer transition-[border-color,background] duration-150"
                  >
                    <Plus className="w-3 h-3" /> 添加二级标题
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-line">
          <button
            type="button"
            onClick={addSection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white/60 text-xs font-[620] text-foreground hover:bg-white/80 cursor-pointer transition-[background]"
          >
            <Plus className="w-3.5 h-3.5" /> 添加章节
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-[660] text-white bg-gradient-to-r from-[#cf4657] to-[#aa2639] hover:from-[#c23b4d] hover:to-[#981f32] cursor-pointer shadow-sm transition-[background]"
          >
            完成
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ── 章节内容编辑器:写作模式切换 + prompt/fill 内容 ── */
function SectionContentEditor({
  section,
  onUpdate,
  compact = false,
}: {
  section: TemplateSection
  onUpdate: (id: string, patch: Partial<TemplateSection>) => void
  compact?: boolean
}) {
  const setMode = (mode: SectionWritingMode) => onUpdate(section.id, { writingMode: mode })
  const placeholders = section.writingMode === "fill" ? parsePlaceholders(section.fillTemplate) : []

  return (
    <div className={cn("mb-2", compact && "mb-1.5")}>
      {/* mode toggle */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={() => setMode("prompt")}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-[620] cursor-pointer transition-[background,color] duration-150",
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
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-[620] cursor-pointer transition-[background,color] duration-150",
              section.writingMode === "fill"
                ? "bg-accent-soft text-accent-deep"
                : "bg-transparent text-muted-text hover:bg-white/60"
            )}
          >
            文本+占位符
          </button>
        </div>
      </div>

      {/* content */}
      {section.writingMode === "prompt" ? (
        <textarea
          value={section.generationHint}
          onChange={(e) => onUpdate(section.id, { generationHint: e.target.value })}
          placeholder={compact ? "生成提示词:AI 该为本二级标题写什么" : "生成提示词:AI 该为本章节写什么"}
          className={cn(
            "w-full text-xs leading-relaxed rounded-lg p-2 resize-y",
            "bg-white/60 border border-line text-foreground placeholder:text-subtle focus:outline-none",
            "focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
            "transition-[border-color,box-shadow]",
            compact ? "min-h-[44px]" : "min-h-[60px]"
          )}
        />
      ) : (
        <div>
          <textarea
            value={section.fillTemplate}
            onChange={(e) => onUpdate(section.id, { fillTemplate: e.target.value })}
            placeholder="输入固定文本,用 {{占位符}} 标记待 AI 填充的内容"
            className={cn(
              "w-full text-xs leading-relaxed rounded-lg p-2 resize-y",
              "bg-white/60 border border-line text-foreground placeholder:text-subtle focus:outline-none",
              "focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow]",
              compact ? "min-h-[56px]" : "min-h-[72px]"
            )}
          />
          {placeholders.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              <span className="text-[10px] text-subtle">已识别:</span>
              {placeholders.map((p) => (
                <span key={p} className="px-1.5 py-0.5 rounded-full bg-accent-faint text-accent-deep text-[10px] font-[620]">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
