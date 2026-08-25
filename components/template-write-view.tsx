"use client"

import { useState, useCallback, useMemo, Fragment, type ComponentProps } from "react"
import { LayoutGrid, ArrowRight, X, Pencil, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch } from "@/hooks/use-app-state"
import { modeCopy } from "@/data/modes"
import {
  type WritingTemplate,
  loadSavedTemplates,
  saveTemplates,
  MAX_TEMPLATES,
} from "@/data/template"
import { setTemplateWritingInput } from "@/lib/template-data"
import { collectPlaceholders } from "@/lib/template-writing-engine"
import { TemplatePickerDialog } from "@/components/template-picker-dialog"
import { PlaceholderFieldsForm } from "@/components/placeholder-fields-form"
import { SectionAdjuster } from "@/components/section-adjuster"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/** Group flat sections into [parent, ...children] arrays (read-only display). */
function toGroups(sections: WritingTemplate["sections"]) {
  const groups: WritingTemplate["sections"][] = []
  let current: WritingTemplate["sections"] = []
  for (const s of sections) {
    if (s.level === 1) {
      if (current.length) groups.push(current)
      current = [s]
    } else if (current.length) {
      current.push(s)
    }
  }
  if (current.length) groups.push(current)
  return groups
}

export function TemplateWriteView() {
  const dispatch = useAppDispatch()
  const copy = modeCopy["模板写作"]

  // global prompt fields
  const [documentTitle, setDocumentTitle] = useState("")
  const [draftingUnit, setDraftingUnit] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")

  // selected template
  const [selectedTemplate, setSelectedTemplate] = useState<WritingTemplate | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // P1-⑤: sections adjusted locally for this writing session (not saved back).
  // When null, the template's original sections are used.
  const [adjustedSections, setAdjustedSections] = useState<WritingTemplate["sections"] | null>(null)
  const [adjusterOpen, setAdjusterOpen] = useState(false)

  // P1-④: placeholder values for fill-mode sections.
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({})

  // Effective sections: adjusted copy if present, otherwise the template's originals.
  const effectiveSections = useMemo(
    () => adjustedSections ?? selectedTemplate?.sections ?? [],
    [adjustedSections, selectedTemplate],
  )

  // Collect placeholders from fill-mode sections of the effective template.
  const placeholderFields = useMemo(
    () => collectPlaceholders(effectiveSections),
    [effectiveSections],
  )

  const canStart =
    documentTitle.trim().length > 0 &&
    selectedTemplate !== null &&
    additionalNotes.trim().length > 0

  const handleStart = useCallback(() => {
    if (!selectedTemplate || !canStart) return
    setTemplateWritingInput({
      templateName: selectedTemplate.name,
      sections: effectiveSections,
      // 参考文档展示已移除,模板写作不再携带章节级参考文件。
      referenceFiles: [],
      totalWordCountMin: null,
      totalWordCountMax: null,
      additionalNotes,
      documentTitle,
      draftingUnit,
      placeholderValues,
    })
    dispatch({ type: "SET_CHAT_MODE", mode: "模板写作" })
    dispatch({ type: "CLEAR_CHAT" })
    dispatch({ type: "SET_VIEW", view: "chat" })
  }, [selectedTemplate, canStart, effectiveSections, additionalNotes, documentTitle, draftingUnit, placeholderValues, dispatch])

  // ── Save adjusted sections as a new custom template (preset stays read-only) ──
  const [saveAsNewOpen, setSaveAsNewOpen] = useState(false)
  const [saveAsNewName, setSaveAsNewName] = useState("")
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null)

  const openSaveAsNew = useCallback(() => {
    if (!selectedTemplate) return
    setSaveAsNewName(selectedTemplate.name ? `${selectedTemplate.name}(微调版)` : "")
    setSaveAsNewOpen(true)
  }, [selectedTemplate])

  const handleSaveAsNew = useCallback(() => {
    if (!selectedTemplate) return
    const all = loadSavedTemplates()
    if (all.length >= MAX_TEMPLATES) {
      setNotice({ text: `模板库已满(上限 ${MAX_TEMPLATES} 个),请先在模板库删除不需要的模板`, ok: false })
      setSaveAsNewOpen(false)
      return
    }
    const name = saveAsNewName.trim() || "未命名模板"
    const now = new Date().toISOString()
    const newT: WritingTemplate = {
      ...selectedTemplate,
      id: crypto.randomUUID(),
      name,
      source: "custom",
      sections: effectiveSections.map((s) => ({ ...s, referenceFiles: [...s.referenceFiles] })),
      createdAt: now,
      updatedAt: now,
    }
    saveTemplates([...all, newT])
    setSaveAsNewOpen(false)
    setSaveAsNewName("")
    setNotice({ text: `已保存为自定义模板:${name}(可在模板库查看)`, ok: true })
  }, [selectedTemplate, saveAsNewName, effectiveSections])

  // force re-render of picker list each open by keying on open state
  const hasTemplates = loadSavedTemplates().length > 0

  return (
    <div className="mx-auto w-full min-h-full p-6 md:p-8" style={{ maxWidth: "min(1120px, 100%)" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-[680] text-foreground mb-1">模板写作</h1>
        <p className="text-sm text-muted-text">{copy.subtitle}</p>
      </div>

      {/* ============================================================ */}
      {/*  Card 1 — 写作基础信息(全局提示词)                          */}
      {/* ============================================================ */}
      <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-[660] mb-4">一、写作基础信息</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* 公文标题(必填) */}
          <div>
            <label className="block text-xs font-[620] text-muted-text mb-1.5">
              公文标题<span className="text-accent-deep ml-0.5" aria-hidden>*</span>
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="如：关于XXX的通知"
              className={cn(
                "w-full h-9 px-4 border border-line rounded-4xl text-sm",
                "bg-white/60 text-foreground placeholder:text-subtle",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                "transition-[border-color,box-shadow] duration-150"
              )}
            />
          </div>
          {/* 拟稿单位(选填) */}
          <div>
            <label className="block text-xs font-[620] text-muted-text mb-1.5">拟稿单位</label>
            <input
              type="text"
              value={draftingUnit}
              onChange={(e) => setDraftingUnit(e.target.value)}
              placeholder="如：办公室"
              className={cn(
                "w-full h-9 px-4 border border-line rounded-4xl text-sm",
                "bg-white/60 text-foreground placeholder:text-subtle",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                "transition-[border-color,box-shadow] duration-150"
              )}
            />
          </div>
        </div>

        {/* 写作要求(必填) */}
        <div>
          <label className="block text-xs font-[620] text-muted-text mb-1.5">
            写作要求<span className="text-accent-deep ml-0.5" aria-hidden>*</span>
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="描述本次写作的具体要求，如重点内容、口径、注意事项..."
            className={cn(
              "w-full min-h-[100px] border border-line rounded-xl p-4 text-sm leading-relaxed resize-y",
              "bg-white/60 text-foreground placeholder:text-subtle",
              "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow] duration-150"
            )}
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Card 2 — 选取模板                                            */}
      {/* ============================================================ */}
      <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-[660] mb-4">
          二、选取模板
          {selectedTemplate && (
            <span className="ml-2 text-[11px] font-[580] text-muted-text">
              （如需编辑模板，请到模板库）
            </span>
          )}
        </h3>

        {notice && (
          <div
            className={cn(
              "mb-3 rounded-xl px-4 py-2.5 text-xs font-[580] border",
              notice.ok
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-accent-soft/60 border-[rgba(200,60,78,0.24)] text-accent-deep",
            )}
          >
            {notice.text}
          </div>
        )}

        {selectedTemplate ? (
          <SelectedTemplateSummary
            template={selectedTemplate}
            sections={effectiveSections}
            adjusted={adjustedSections !== null}
            onReplace={() => setPickerOpen(true)}
            onRemove={() => {
              setSelectedTemplate(null)
              setAdjustedSections(null)
              setPlaceholderValues({})
            }}
            onAdjust={() => {
              setAdjustedSections(effectiveSections.map((s) => ({ ...s })))
              setAdjusterOpen(true)
            }}
            onSaveAsNew={openSaveAsNew}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={cn(
              "w-full flex flex-col items-center justify-center gap-2 py-10",
              "border-2 border-dashed border-line rounded-xl",
              "hover:border-[rgba(200,60,78,0.36)] hover:bg-accent-faint/40 cursor-pointer",
              "transition-[border-color,background] duration-150"
            )}
          >
            <span className="w-12 h-12 rounded-2xl bg-accent-faint text-accent-deep grid place-items-center">
              <LayoutGrid className="w-6 h-6" />
            </span>
            <span className="text-sm font-[620] text-foreground">
              {hasTemplates ? "点击选取模板" : "点击选取模板（暂无模板，将打开空列表）"}
            </span>
            <span className="text-xs text-muted-text">从模板库中选择结构模板，确定公文章节骨架</span>
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Card 3 — 待填字段 (仅当模板含 fill 占位符时显示)              */}
      {/* ============================================================ */}
      {selectedTemplate && placeholderFields.length > 0 && (
        <PlaceholderFieldsForm
          fields={placeholderFields}
          values={placeholderValues}
          onChange={setPlaceholderValues}
        />
      )}

      {/* ============================================================ */}
      {/*  Start writing                                               */}
      {/* ============================================================ */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-[660]",
            "transition-[background,opacity] duration-150",
            canStart
              ? "text-white bg-gradient-to-r from-[#cf4657] to-[#aa2639] hover:from-[#c23b4d] hover:to-[#981f32] cursor-pointer shadow-sm"
              : "bg-muted/40 text-muted-text cursor-not-allowed"
          )}
        >
          开始写作
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <TemplatePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(t) => {
          setSelectedTemplate(t)
          setAdjustedSections(null)
          setPlaceholderValues({})
        }}
      />

      {adjusterOpen && selectedTemplate && (
        <SectionAdjuster
          templateName={selectedTemplate.name}
          sections={adjustedSections ?? selectedTemplate.sections}
          onChange={setAdjustedSections}
          onClose={() => setAdjusterOpen(false)}
        />
      )}

      {/* 另存为自定义模板 — 命名对话框 */}
      <Dialog open={saveAsNewOpen} onOpenChange={setSaveAsNewOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-2 space-y-3">
            <DialogHeader>
              <DialogTitle className="text-left text-base font-semibold tracking-tight">
                另存为自定义模板
              </DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                将本次微调后的结构保存为新模板,原预设模板保持不变。请输入新模板名称:
              </DialogDescription>
            </DialogHeader>
            <input
              type="text"
              value={saveAsNewName}
              onChange={(e) => setSaveAsNewName(e.target.value)}
              className="w-full h-9 px-3 border border-line rounded-lg text-sm bg-white/60 focus:outline-none focus:border-[rgba(200,60,78,0.36)] transition-[border-color] duration-150"
              autoFocus
            />
          </div>
          <DialogFooter className="flex-row justify-end gap-2 px-6 pb-6 pt-4">
            <DialogClose render={(props: ComponentProps<"button">) => <Button variant="outline" size="default" {...props} />}>
              取消
            </DialogClose>
            <Button size="default" onClick={handleSaveAsNew} disabled={!saveAsNewName.trim()}>
              确认保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Selected template summary (read-only)                             */
/* ------------------------------------------------------------------ */

function SelectedTemplateSummary({
  template,
  sections,
  adjusted,
  onReplace,
  onRemove,
  onAdjust,
  onSaveAsNew,
}: {
  template: WritingTemplate
  sections: WritingTemplate["sections"]
  adjusted: boolean
  onReplace: () => void
  onRemove: () => void
  onAdjust: () => void
  onSaveAsNew: () => void
}) {
  const isPreset = template.id.startsWith("preset-")
  const groups = toGroups(sections)

  return (
    <div className="relative border border-line rounded-xl p-4 bg-white/60">
      {/* header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="w-9 h-9 rounded-xl bg-accent-faint text-accent-deep grid place-items-center flex-none">
          <LayoutGrid className="w-4.5 h-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-[680] text-foreground truncate">{template.name}</h4>
            <span
              className={cn(
                "text-[9px] font-[660] px-1.5 py-0.5 rounded flex-none",
                isPreset ? "bg-primary/10 text-primary" : "bg-accent-soft text-accent-deep"
              )}
            >
              {isPreset ? "预设" : template.source === "file" ? "文件提取" : "自定义"}
            </span>
            {adjusted && (
              <span className="text-[9px] font-[660] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 flex-none">
                已微调
              </span>
            )}
          </div>
          <p className="text-xs text-muted-text mt-0.5">
            {groups.length} 个一级标题 · 共 {sections.length} 个章节
          </p>
        </div>
      </div>

      {/* section list (read-only, with sub-heading indent) */}
      <div className="space-y-1.5 border-t border-line pt-3">
        {groups.map((group, gi) => (
          <div key={group[0].id}>
            {group.map((s, si) => {
              const isSub = s.level === 2
              const label = isSub ? `${gi + 1}.${si}` : `${gi + 1}`
              const wordRange =
                s.wordCountMin != null && s.wordCountMax != null
                  ? `${s.wordCountMin}-${s.wordCountMax}字`
                  : s.wordCountMin != null
                    ? `≥${s.wordCountMin}字`
                    : s.wordCountMax != null
                      ? `≤${s.wordCountMax}字`
                      : ""
              return (
                <Fragment key={s.id}>
                  <div
                    className={cn(
                      "flex items-center gap-2 py-1",
                      isSub && "ml-6"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] font-[680] text-muted-text w-6 text-center flex-none",
                        isSub && "text-[10px]"
                      )}
                    >
                      {label}
                    </span>
                    <span
                      className={cn(
                        "text-xs flex-1 min-w-0 truncate",
                        isSub ? "text-muted-text font-[560]" : "text-foreground font-[600]"
                      )}
                    >
                      {s.title || "（无标题）"}
                    </span>
                    {wordRange && (
                      <span className="text-[10px] text-subtle flex-none">{wordRange}</span>
                    )}
                    {s.writingMode === "fill" && (
                      <span className="text-[10px] text-accent-deep/70 flex-none">占位符</span>
                    )}
                  </div>
                </Fragment>
              )
            })}
          </div>
        ))}
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
        <button
          type="button"
          onClick={onReplace}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white/60 text-xs font-[620] cursor-pointer hover:bg-white/80 transition-[background] duration-150"
        >
          <LayoutGrid className="w-3.5 h-3.5" /> 更换模板
        </button>
        <button
          type="button"
          onClick={onAdjust}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white/60 text-xs font-[620] text-foreground cursor-pointer hover:bg-white/80 transition-[background] duration-150"
        >
          <Pencil className="w-3.5 h-3.5" /> {adjusted ? "继续微调" : "本次微调"}
        </button>
        {adjusted && (
          <button
            type="button"
            onClick={onSaveAsNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent-deep/30 bg-accent-soft/50 text-xs font-[620] text-accent-deep cursor-pointer hover:bg-accent-soft transition-[background] duration-150"
            title="将本次微调后的结构保存为新的自定义模板,原预设不变"
          >
            <Save className="w-3.5 h-3.5" /> 另存为自定义模板
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-[620] text-muted-text hover:text-accent-deep cursor-pointer border-0 bg-transparent transition-colors duration-150"
        >
          <X className="w-3.5 h-3.5" /> 移除
        </button>
      </div>
    </div>
  )
}
