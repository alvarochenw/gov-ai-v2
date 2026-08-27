"use client"

import { useState, useCallback, useMemo, Fragment } from "react"
import { LayoutGrid, ArrowRight, ArrowLeft, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppState } from "@/hooks/use-app-state"
import { modeCopy } from "@/data/modes"
import { type WritingTemplate, loadSavedTemplates } from "@/data/template"
import { type ReferenceFile, type TemplateWritingInput } from "@/lib/template-data"
import { TemplatePickerDialog } from "@/components/template-picker-dialog"
import { ReferenceFilesEditor } from "@/components/reference-files-editor"
import { StepIndicator } from "@/components/step-indicator"
import { TemplateWritingChat } from "@/components/template-writing-chat"
import { StyleSelect } from "@/components/style-select"
import { loadSavedStyleTemplates } from "@/data/style"

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
  const { files: knowledgeFiles } = useAppState()
  const copy = modeCopy["模板写作"]

  // 第一步:写作配置
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [generationInput, setGenerationInput] = useState<TemplateWritingInput | null>(null)
  const [documentTitle, setDocumentTitle] = useState("")
  const [draftingUnit, setDraftingUnit] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [selectedStyleId, setSelectedStyleId] = useState("")

  // 风格模板列表(含后台自定义),挂载时读一次
  const styleTemplates = useMemo(() => loadSavedStyleTemplates(), [])

  // 选取模板
  const [selectedTemplate, setSelectedTemplate] = useState<WritingTemplate | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // 第二步:参考文档(本地 / 知识库),供 AI 提取占位符字段并辅助生成
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([])

  const effectiveSections = useMemo(
    () => selectedTemplate?.sections ?? [],
    [selectedTemplate],
  )

  const canNext =
    documentTitle.trim().length > 0 &&
    selectedTemplate !== null &&
    additionalNotes.trim().length > 0

  const handleStart = useCallback(() => {
    if (!selectedTemplate || !canNext) return
    setGenerationInput({
      templateName: selectedTemplate.name,
      sections: effectiveSections,
      referenceFiles,
      totalWordCountMin: null,
      totalWordCountMax: null,
      additionalNotes,
      documentTitle,
      draftingUnit,
      // 占位符值改由 AI 从参考文档提取,配置页不再收集用户填写
      placeholderValues: {},
    })
    setStep(3)
  }, [selectedTemplate, canNext, effectiveSections, referenceFiles, additionalNotes, documentTitle, draftingUnit])

  const hasTemplates = loadSavedTemplates().length > 0

  return (
    <div className="mx-auto w-full min-h-full p-6 md:p-8" style={{ maxWidth: "min(1120px, 100%)" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-[680] text-foreground mb-1">模板写作</h1>
        <p className="text-sm text-muted-text">
          {step === 3
            ? `${documentTitle || "未命名公文"}${draftingUnit ? ` · ${draftingUnit}` : ""}${referenceFiles.length > 0 ? ` · ${referenceFiles.length} 个参考文档` : ""}`
            : copy.subtitle}
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator step={step} onNavigate={(t) => setStep(t as 1 | 2 | 3)} />

      {step === 3 ? (
        generationInput ? <TemplateWritingChat input={generationInput} /> : null
      ) : step === 1 ? (
        <>
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

            {/* 风格模板(选填) */}
            <div className="mb-4">
              <label className="block text-xs font-[620] text-muted-text mb-1.5">风格模板</label>
              <StyleSelect
                value={selectedStyleId}
                options={styleTemplates}
                onChange={setSelectedStyleId}
              />
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

            {selectedTemplate ? (
              <SelectedTemplateSummary
                template={selectedTemplate}
                sections={effectiveSections}
                onReplace={() => setPickerOpen(true)}
                onRemove={() => {
                  setSelectedTemplate(null)
                  setReferenceFiles([])
                }}
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

          {/* 下一步 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canNext}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-[660]",
                "transition-[background,opacity] duration-150",
                canNext
                  ? "text-white bg-gradient-to-r from-[#cf4657] to-[#aa2639] hover:from-[#c23b4d] hover:to-[#981f32] cursor-pointer shadow-sm"
                  : "bg-muted/40 text-muted-text cursor-not-allowed"
              )}
            >
              下一步
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* ============================================================ */}
          {/*  Step 2 — 参考文档                                            */}
          {/* ============================================================ */}
          {/* 配置摘要 + 修改入口 */}
          {selectedTemplate && (
            <div className="bg-white/60 border border-line rounded-xl p-4 mb-6 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-accent-faint text-accent-deep grid place-items-center flex-none">
                <LayoutGrid className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-[620] text-foreground truncate">{selectedTemplate.name}</p>
                <p className="text-xs text-muted-text truncate">
                  {documentTitle || "未命名公文"}
                  {draftingUnit ? ` · ${draftingUnit}` : ""}
                  {selectedStyleId ? ` · 风格：${styleTemplates.find((t) => t.id === selectedStyleId)?.name ?? ""}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-[620] text-accent-deep hover:underline cursor-pointer border-0 bg-transparent"
              >
                修改配置
              </button>
            </div>
          )}

          {/* 参考文档卡 */}
          <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
            <h3 className="text-sm font-[660] mb-1">二、参考文档</h3>
            <p className="text-xs text-muted-text mb-4 leading-relaxed">
              从本地或知识库选择参考材料，AI 将从中提取占位符字段并辅助各章节生成。可不选，直接开始写作。
            </p>
            <ReferenceFilesEditor
              files={referenceFiles}
              onChange={setReferenceFiles}
              knowledgeFiles={knowledgeFiles}
            />
          </div>

          {/* 上一步 / 开始写作 */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-[660]",
                "border border-line bg-white/60 text-muted-text hover:text-foreground hover:bg-white/80 cursor-pointer",
                "transition-[background,color] duration-150"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
              上一步
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={!canNext}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-[660]",
                "transition-[background,opacity] duration-150",
                canNext
                  ? "text-white bg-gradient-to-r from-[#cf4657] to-[#aa2639] hover:from-[#c23b4d] hover:to-[#981f32] cursor-pointer shadow-sm"
                  : "bg-muted/40 text-muted-text cursor-not-allowed"
              )}
            >
              开始写作
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      <TemplatePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(t) => {
          setSelectedTemplate(t)
          setReferenceFiles([])
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Selected template summary (read-only)                             */
/* ------------------------------------------------------------------ */

function SelectedTemplateSummary({
  template,
  sections,
  onReplace,
  onRemove,
}: {
  template: WritingTemplate
  sections: WritingTemplate["sections"]
  onReplace: () => void
  onRemove: () => void
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
              {isPreset ? "预设" : "自定义"}
            </span>
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
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-[620] text-muted-text hover:text-accent-deep cursor-pointer border-0 bg-transparent transition-colors duration-150"
        >
          <X className="w-3.5 h-3.5" /> 移除
        </button>
      </div>
    </div>
  )
}
