"use client"

import { useState, useCallback } from "react"
import {
  ArrowLeft, LayoutGrid, Palette, Pencil, Shield, FileStack,
  Plus, Upload, Copy, Trash2, Loader2, X, AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppState } from "@/hooks/use-app-state"
import {
  type WritingTemplate,
  type TemplateSection,
  type SectionWritingMode,
  loadSavedTemplates,
  saveTemplates,
  createBlankTemplate,
  MAX_TEMPLATES,
} from "@/data/template"
import {
  type StyleTemplate,
  type StyleSpec,
  type DocumentType,
  recommendedSpecFor,
  loadSavedStyleTemplates,
  saveStyleTemplates,
  createBlankStyleTemplate,
} from "@/data/style"
import {
  updateSection, addSection, addSubsection,
  promoteSection, demoteSection, removeSection, moveSection,
} from "@/lib/template-section-ops"
import { StructureEditPanel, StyleEditPanel } from "@/components/template-library-view"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ExtractTemplateDialog } from "@/components/extract-template-dialog"
import {
  Dialog, DialogClose, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type AdminTab = "structure" | "style"
type SourceFilter = "all" | "preset" | "custom" | "file"

const uid = () => crypto.randomUUID()

/** Classify a template id/source into a display source label. */
function sourceLabelOf(t: { id: string; source: string }): "预设" | "自定义" | "文件提取" {
  if (t.id.startsWith("preset-")) return "预设"
  if (t.source === "file") return "文件提取"
  return "自定义"
}

function matchesSource(t: { id: string; source: string }, f: SourceFilter): boolean {
  if (f === "all") return true
  if (f === "preset") return t.id.startsWith("preset-")
  if (f === "file") return t.source === "file"
  return !t.id.startsWith("preset-") && t.source !== "file"
}

export function AdminShell() {
  const dispatch = useAppDispatch()
  const { files: knowledgeFiles } = useAppState()
  const [activeTab, setActiveTab] = useState<AdminTab>("structure")

  /* ── 结构模板 ── */
  const [structTemplates, setStructTemplates] = useState<WritingTemplate[]>(() => loadSavedTemplates())
  const [structEditing, setStructEditing] = useState<WritingTemplate | null>(null)
  const [structSearch, setStructSearch] = useState("")
  const [structSource, setStructSource] = useState<SourceFilter>("all")
  const [structExtracting, setStructExtracting] = useState(false)
  const [structExtractError, setStructExtractError] = useState<string | null>(null)
  const [structExtractOpen, setStructExtractOpen] = useState(false)
  const [structDeleteTarget, setStructDeleteTarget] = useState<WritingTemplate | null>(null)
  const [structSaveAsOpen, setStructSaveAsOpen] = useState(false)
  const [structSaveAsName, setStructSaveAsName] = useState("")
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null)

  /* ── 风格模板 ── */
  const [styleTemplates, setStyleTemplates] = useState<StyleTemplate[]>(() => loadSavedStyleTemplates())
  const [styleEditing, setStyleEditing] = useState<StyleTemplate | null>(null)
  const [styleSearch, setStyleSearch] = useState("")
  const [styleSource, setStyleSource] = useState<SourceFilter>("all")
  const [styleExtracting, setStyleExtracting] = useState(false)
  const [styleExtractError, setStyleExtractError] = useState<string | null>(null)
  const [styleExtractOpen, setStyleExtractOpen] = useState(false)
  const [styleDeleteTarget, setStyleDeleteTarget] = useState<StyleTemplate | null>(null)
  const [styleSaveAsOpen, setStyleSaveAsOpen] = useState(false)
  const [styleSaveAsName, setStyleSaveAsName] = useState("")

  const showNotice = useCallback((text: string, ok: boolean) => {
    setNotice({ text, ok })
    window.setTimeout(() => setNotice(null), 3000)
  }, [])

  /* ── 结构:章节编辑回调 ── */
  const updateStructSections = useCallback((fn: (sections: TemplateSection[]) => TemplateSection[]) => {
    setStructEditing((prev) => (prev ? { ...prev, sections: fn(prev.sections) } : prev))
  }, [])
  const handleStructUpdateSection = useCallback((id: string, patch: Partial<TemplateSection>) =>
    updateStructSections((s) => updateSection(s, id, patch)), [updateStructSections])
  const handleStructAddSection = useCallback(() =>
    updateStructSections(addSection), [updateStructSections])
  const handleStructAddSubsection = useCallback((parentId: string) =>
    updateStructSections((s) => addSubsection(s, parentId)), [updateStructSections])
  const handleStructPromote = useCallback((id: string) =>
    updateStructSections((s) => promoteSection(s, id)), [updateStructSections])
  const handleStructDemote = useCallback((id: string) =>
    updateStructSections((s) => demoteSection(s, id)), [updateStructSections])
  const handleStructRemove = useCallback((id: string) =>
    updateStructSections((s) => removeSection(s, id)), [updateStructSections])
  const handleStructMove = useCallback((id: string, dir: "up" | "down") =>
    updateStructSections((s) => moveSection(s, id, dir)), [updateStructSections])

  /* ── 结构:保存 / 另存为 / 删除 / 复制 ── */
  const persistStruct = useCallback((next: WritingTemplate[]) => {
    setStructTemplates(next)
    saveTemplates(next)
  }, [])

  const handleStructSave = useCallback(() => {
    if (!structEditing) return
    const now = new Date().toISOString()
    const updated = { ...structEditing, updatedAt: now }
    const exists = structTemplates.some((t) => t.id === updated.id)
    if (exists) {
      persistStruct(structTemplates.map((t) => (t.id === updated.id ? updated : t)))
      showNotice("模板已更新", true)
    } else {
      if (structTemplates.length >= MAX_TEMPLATES) {
        showNotice(`模板库已满(上限 ${MAX_TEMPLATES} 个),无法新增`, false)
        return
      }
      persistStruct([...structTemplates, updated])
      showNotice("模板已新建", true)
    }
    setStructEditing(null)
  }, [structEditing, structTemplates, persistStruct, showNotice])

  const handleStructSaveAsNewConfirm = useCallback(() => {
    if (!structEditing || structTemplates.length >= MAX_TEMPLATES) return
    const name = structSaveAsName.trim() || "未命名模板"
    const now = new Date().toISOString()
    const newT: WritingTemplate = {
      ...structEditing, id: uid(), name, source: "custom",
      createdAt: now, updatedAt: now,
    }
    persistStruct([...structTemplates, newT])
    setStructSaveAsOpen(false)
    setStructSaveAsName("")
    setStructEditing(null)
    showNotice("已另存为新模板", true)
  }, [structEditing, structTemplates, persistStruct, structSaveAsName, showNotice])

  const handleStructDelete = useCallback(() => {
    if (!structDeleteTarget) return
    persistStruct(structTemplates.filter((t) => t.id !== structDeleteTarget.id))
    if (structEditing?.id === structDeleteTarget.id) setStructEditing(null)
    setStructDeleteTarget(null)
    showNotice("模板已删除", true)
  }, [structDeleteTarget, structTemplates, structEditing, persistStruct, showNotice])

  const handleStructCopy = useCallback((t: WritingTemplate) => {
    if (structTemplates.length >= MAX_TEMPLATES) {
      showNotice(`模板库已满(上限 ${MAX_TEMPLATES} 个),无法复制`, false)
      return
    }
    const now = new Date().toISOString()
    persistStruct([...structTemplates, {
      ...t, id: uid(), name: `${t.name} (副本)`, source: "custom", createdAt: now, updatedAt: now,
    }])
    showNotice("已复制副本", true)
  }, [structTemplates, persistStruct, showNotice])

  /* ── 结构:AI 提取 ── */
  const handleStructExtract = useCallback(async (file: File, mode: SectionWritingMode) => {
    const fileName = file.name
    setStructExtracting(true)
    setStructExtractError(null)
    try {
      let template: WritingTemplate
      if (fileName.toLowerCase().endsWith(".docx")) {
        const { extractDocxText } = await import("@/lib/parse-docx")
        const { extractTemplateFromText } = await import("@/lib/extract-template-from-text")
        const { llmExtractTemplate, LLMNotConfiguredError } = await import("@/lib/llm-extract-template")
        const text = await extractDocxText(file)
        let fromLLM = false
        try {
          template = await llmExtractTemplate(text, fileName, mode)
          fromLLM = true
        } catch (err) {
          if (!(err instanceof LLMNotConfiguredError)) {
            console.warn("[模板提取] LLM 失败,回退正则提取:", err instanceof Error ? err.message : err)
          }
          template = extractTemplateFromText(text, fileName)
        }
        if (!fromLLM && mode === "fill") {
          template = {
            ...template,
            sections: template.sections.map((s) => ({
              ...s,
              writingMode: "fill" as const,
              fillTemplate: s.fillTemplate?.trim() || s.generationHint || "",
            })),
          }
        }
      } else {
        template = await (await import("@/data/template")).mockExtractFromFile(fileName)
      }
      setStructEditing(template)
    } catch (err) {
      setStructExtractError(err instanceof Error ? err.message : "提取失败,请检查文件格式")
    } finally {
      setStructExtracting(false)
    }
  }, [])

  /* ── 风格:编辑回调 ── */
  const handleStyleUpdateSpec = useCallback((patch: Partial<StyleSpec>) => {
    setStyleEditing((prev) => (prev ? { ...prev, styleSpec: { ...prev.styleSpec, ...patch } } : prev))
  }, [])
  const handleStyleApplyRecommended = useCallback((docType: DocumentType | "") => {
    setStyleEditing((prev) => (prev ? { ...prev, styleSpec: { ...recommendedSpecFor(docType) } } : prev))
  }, [])
  const handleStyleUpdateRequirement = useCallback((index: number, value: string) => {
    setStyleEditing((prev) => {
      if (!prev) return prev
      const next = [...prev.writingRequirements]
      next[index] = value
      return { ...prev, writingRequirements: next }
    })
  }, [])
  const handleStyleAddRequirement = useCallback(() => {
    setStyleEditing((prev) => (prev ? { ...prev, writingRequirements: [...prev.writingRequirements, ""] } : prev))
  }, [])
  const handleStyleRemoveRequirement = useCallback((index: number) => {
    setStyleEditing((prev) => (prev ? { ...prev, writingRequirements: prev.writingRequirements.filter((_, i) => i !== index) } : prev))
  }, [])
  const handleStyleMoveRequirement = useCallback((index: number, direction: "up" | "down") => {
    setStyleEditing((prev) => {
      if (!prev) return prev
      const arr = [...prev.writingRequirements]
      const swap = direction === "up" ? index - 1 : index + 1
      if (swap < 0 || swap >= arr.length) return prev
      ;[arr[index], arr[swap]] = [arr[swap], arr[index]]
      return { ...prev, writingRequirements: arr }
    })
  }, [])

  /* ── 风格:保存 / 另存为 / 删除 / 复制 ── */
  const persistStyle = useCallback((next: StyleTemplate[]) => {
    setStyleTemplates(next)
    saveStyleTemplates(next)
  }, [])

  const handleStyleSave = useCallback(() => {
    if (!styleEditing) return
    const now = new Date().toISOString()
    const updated = {
      ...styleEditing,
      writingRequirements: styleEditing.writingRequirements.map((r) => r.trim()).filter(Boolean),
      updatedAt: now,
    }
    const exists = styleTemplates.some((t) => t.id === updated.id)
    if (exists) {
      persistStyle(styleTemplates.map((t) => (t.id === updated.id ? updated : t)))
      showNotice("模板已更新", true)
    } else {
      if (styleTemplates.length >= MAX_TEMPLATES) {
        showNotice(`模板库已满(上限 ${MAX_TEMPLATES} 个),无法新增`, false)
        return
      }
      persistStyle([...styleTemplates, updated])
      showNotice("模板已新建", true)
    }
    setStyleEditing(null)
  }, [styleEditing, styleTemplates, persistStyle, showNotice])

  const handleStyleSaveAsNewConfirm = useCallback(() => {
    if (!styleEditing || styleTemplates.length >= MAX_TEMPLATES) return
    const name = styleSaveAsName.trim() || "未命名模板"
    const now = new Date().toISOString()
    const newT: StyleTemplate = {
      ...styleEditing, id: uid(), name, source: "custom",
      createdAt: now, updatedAt: now,
    }
    persistStyle([...styleTemplates, newT])
    setStyleSaveAsOpen(false)
    setStyleSaveAsName("")
    setStyleEditing(null)
    showNotice("已另存为新模板", true)
  }, [styleEditing, styleTemplates, persistStyle, styleSaveAsName, showNotice])

  const handleStyleDelete = useCallback(() => {
    if (!styleDeleteTarget) return
    persistStyle(styleTemplates.filter((t) => t.id !== styleDeleteTarget.id))
    if (styleEditing?.id === styleDeleteTarget.id) setStyleEditing(null)
    setStyleDeleteTarget(null)
    showNotice("模板已删除", true)
  }, [styleDeleteTarget, styleTemplates, styleEditing, persistStyle, showNotice])

  const handleStyleCopy = useCallback((t: StyleTemplate) => {
    if (styleTemplates.length >= MAX_TEMPLATES) {
      showNotice(`模板库已满(上限 ${MAX_TEMPLATES} 个),无法复制`, false)
      return
    }
    const now = new Date().toISOString()
    persistStyle([...styleTemplates, {
      ...t, id: uid(), name: `${t.name} (副本)`, source: "custom", createdAt: now, updatedAt: now,
    }])
    showNotice("已复制副本", true)
  }, [styleTemplates, persistStyle, showNotice])

  /* ── 风格:AI 提取 ── */
  const handleStyleExtract = useCallback(async (file: File) => {
    const fileName = file.name
    setStyleExtracting(true)
    setStyleExtractError(null)
    try {
      let template: StyleTemplate
      if (fileName.toLowerCase().endsWith(".docx")) {
        const { extractDocxText } = await import("@/lib/parse-docx")
        const { llmExtractStyle, LLMStyleNotConfiguredError } = await import("@/lib/llm-extract-style")
        const text = await extractDocxText(file)
        try {
          template = await llmExtractStyle(text, fileName)
        } catch (err) {
          if (!(err instanceof LLMStyleNotConfiguredError)) {
            console.warn("[风格提取] LLM 失败,回退 mock:", err instanceof Error ? err.message : err)
          }
          template = await (await import("@/data/style")).mockExtractStyleFromFile(fileName)
        }
      } else {
        template = await (await import("@/data/style")).mockExtractStyleFromFile(fileName)
      }
      setStyleEditing(template)
    } catch (err) {
      setStyleExtractError(err instanceof Error ? err.message : "提取失败,请检查文件格式")
    } finally {
      setStyleExtracting(false)
    }
  }, [])

  const goBack = () => dispatch({ type: "SET_VIEW", view: "home" })

  /* ── 排序+过滤 ── */
  const filteredStruct = [...structTemplates]
    .filter((t) => matchesSource(t, structSource))
    .filter((t) => !structSearch.trim() || t.name.toLowerCase().includes(structSearch.toLowerCase()))
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
  const filteredStyle = [...styleTemplates]
    .filter((t) => matchesSource(t, styleSource))
    .filter((t) => !styleSearch.trim() || t.name.toLowerCase().includes(styleSearch.toLowerCase()))
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))

  const structIsPreset = structEditing?.id.startsWith("preset-") ?? false
  const styleIsPreset = styleEditing?.id.startsWith("preset-") ?? false

  return (
    <div className="min-h-dvh flex">
      {/* 后台独立左侧栏 */}
      <aside className="w-[276px] max-[800px]:hidden h-dvh flex-none flex flex-col border-r border-line bg-white/60">
        <div className="h-14 flex items-center gap-2 px-5 border-b border-line">
          <span className="w-8 h-8 grid place-items-center rounded-lg bg-accent-soft text-accent-deep">
            <Shield className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <strong className="block text-[13px] text-foreground">系统后台</strong>
            <small className="block text-[10px] text-subtle">管理控制台</small>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-accent-soft/60 text-accent-deep cursor-default">
            <FileStack className="w-4 h-4" />
            <span className="text-sm font-[620]">模板管理</span>
          </div>
        </nav>
        <div className="px-3 py-3 border-t border-line">
          <button
            type="button"
            onClick={goBack}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-[620] border border-line bg-white/60 text-muted-text hover:text-accent-deep hover:bg-white/80 cursor-pointer transition-[background,color] duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            返回前台
          </button>
        </div>
      </aside>

      {/* 内容区 */}
      <section className="flex-1 min-w-0 h-dvh overflow-auto p-9 max-[800px]:p-[25px_16px_42px]">
        <div className="w-[min(960px,100%)] mx-auto">
          <div className="mb-6">
            <h1 className="text-[27px] tracking-[-0.03em]">模板管理</h1>
            <p className="mt-2 text-muted-text text-[13px] leading-relaxed">管理结构与风格预设模板,改动即时生效(覆盖存于本地浏览器)</p>
          </div>

          {/* notice */}
          {notice && (
            <div
              className={cn(
                "mb-4 rounded-xl px-4 py-2.5 text-xs font-[580] border",
                notice.ok
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-accent-soft/60 border-[rgba(200,60,78,0.24)] text-accent-deep",
              )}
            >
              {notice.text}
            </div>
          )}

          {/* 结构/风格 子 tab */}
          <div className="flex gap-2 mb-6">
            {([
              { key: "structure" as AdminTab, label: "结构模板", icon: LayoutGrid },
              { key: "style" as AdminTab, label: "风格模板", icon: Palette },
            ]).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
                  activeTab === tab.key
                    ? "bg-accent-soft text-accent-deep border-[rgba(200,60,78,0.24)]"
                    : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "structure" ? (
            structEditing ? (
              <StructureEditPanel
                template={structEditing}
                readOnly={false}
                isPreset={structIsPreset}
                onUpdateTemplate={setStructEditing}
                onUpdateSection={handleStructUpdateSection}
                onAddSection={handleStructAddSection}
                onAddSubsection={handleStructAddSubsection}
                onPromoteSection={handleStructPromote}
                onDemoteSection={handleStructDemote}
                onRemoveSection={handleStructRemove}
                onMoveSection={handleStructMove}
                onSave={handleStructSave}
                onSaveAsNew={() => {
                  setStructSaveAsName(structEditing.name ? `${structEditing.name} (副本)` : "未命名模板")
                  setStructSaveAsOpen(true)
                }}
                onBack={() => setStructEditing(null)}
                canSaveAsNew={!structIsPreset && structTemplates.length < MAX_TEMPLATES}
              />
            ) : (
              <AdminBrowsePanel
                kind="structure"
                templates={filteredStruct}
                totalCount={structTemplates.length}
                search={structSearch}
                onSearch={setStructSearch}
                source={structSource}
                onSource={setStructSource}
                isExtracting={structExtracting}
                extractError={structExtractError}
                onDismissError={() => setStructExtractError(null)}
                onOpenExtract={() => setStructExtractOpen(true)}
                onCreateBlank={() => setStructEditing(createBlankTemplate())}
                onEdit={(t) => setStructEditing({ ...t, sections: t.sections.map((s) => ({ ...s })) })}
                onCopy={handleStructCopy}
                onDelete={setStructDeleteTarget}
              />
            )
          ) : (
            styleEditing ? (
              <StyleEditPanel
                template={styleEditing}
                readOnly={false}
                isPreset={styleIsPreset}
                onUpdateTemplate={setStyleEditing}
                onUpdateSpec={handleStyleUpdateSpec}
                onApplyRecommendedSpec={handleStyleApplyRecommended}
                onUpdateRequirement={handleStyleUpdateRequirement}
                onAddRequirement={handleStyleAddRequirement}
                onRemoveRequirement={handleStyleRemoveRequirement}
                onMoveRequirement={handleStyleMoveRequirement}
                onSave={handleStyleSave}
                onSaveAsNew={() => {
                  setStyleSaveAsName(styleEditing.name ? `${styleEditing.name} (副本)` : "未命名模板")
                  setStyleSaveAsOpen(true)
                }}
                onBack={() => setStyleEditing(null)}
                canSaveAsNew={!styleIsPreset && styleTemplates.length < MAX_TEMPLATES}
              />
            ) : (
              <AdminBrowsePanel
                kind="style"
                templates={filteredStyle}
                totalCount={styleTemplates.length}
                search={styleSearch}
                onSearch={setStyleSearch}
                source={styleSource}
                onSource={setStyleSource}
                isExtracting={styleExtracting}
                extractError={styleExtractError}
                onDismissError={() => setStyleExtractError(null)}
                onOpenExtract={() => setStyleExtractOpen(true)}
                onCreateBlank={() => setStyleEditing(createBlankStyleTemplate())}
                onEdit={(t) => setStyleEditing({ ...t })}
                onCopy={handleStyleCopy}
                onDelete={setStyleDeleteTarget}
              />
            )
          )}
        </div>
      </section>

      {/* 提取弹窗 */}
      <ExtractTemplateDialog
        open={structExtractOpen}
        isExtracting={structExtracting}
        knowledgeFiles={knowledgeFiles}
        onOpenChange={setStructExtractOpen}
        showMode
        onConfirm={(file, mode) => {
          setStructExtractOpen(false)
          handleStructExtract(file, mode)
        }}
      />
      <ExtractTemplateDialog
        open={styleExtractOpen}
        isExtracting={styleExtracting}
        knowledgeFiles={knowledgeFiles}
        onOpenChange={setStyleExtractOpen}
        showMode={false}
        onConfirm={(file) => {
          setStyleExtractOpen(false)
          handleStyleExtract(file)
        }}
      />

      {/* 删除确认 */}
      <ConfirmDialog
        open={structDeleteTarget !== null}
        onOpenChange={(open) => { if (!open) setStructDeleteTarget(null) }}
        title="删除模板"
        description={`确定删除模板「${structDeleteTarget?.name}」吗?此操作不可撤销。`}
        variant="destructive"
        confirmLabel="删除"
        onConfirm={handleStructDelete}
      />
      <ConfirmDialog
        open={styleDeleteTarget !== null}
        onOpenChange={(open) => { if (!open) setStyleDeleteTarget(null) }}
        title="删除模板"
        description={`确定删除模板「${styleDeleteTarget?.name}」吗?此操作不可撤销。`}
        variant="destructive"
        confirmLabel="删除"
        onConfirm={handleStyleDelete}
      />

      {/* 另存为新模板 — 结构 */}
      <SaveAsNewDialog
        open={structSaveAsOpen}
        name={structSaveAsName}
        onName={setStructSaveAsName}
        onOpenChange={setStructSaveAsOpen}
        onConfirm={handleStructSaveAsNewConfirm}
      />
      {/* 另存为新模板 — 风格 */}
      <SaveAsNewDialog
        open={styleSaveAsOpen}
        name={styleSaveAsName}
        onName={setStyleSaveAsName}
        onOpenChange={setStyleSaveAsOpen}
        onConfirm={handleStyleSaveAsNewConfirm}
      />
    </div>
  )
}

/* ================================================================== */
/*  Browse panel: 工具条 + 列表                                         */
/* ================================================================== */

function AdminBrowsePanel<T extends { id: string; name: string; source: string; updatedAt: string }>({
  kind, templates, totalCount, search, onSearch, source, onSource,
  isExtracting, extractError, onDismissError, onOpenExtract, onCreateBlank,
  onEdit, onCopy, onDelete,
}: {
  kind: "structure" | "style"
  templates: T[]
  totalCount: number
  search: string
  onSearch: (v: string) => void
  source: SourceFilter
  onSource: (v: SourceFilter) => void
  isExtracting: boolean
  extractError: string | null
  onDismissError: () => void
  onOpenExtract: () => void
  onCreateBlank: () => void
  onEdit: (t: T) => void
  onCopy: (t: T) => void
  onDelete: (t: T) => void
}) {
  return (
    <div>
      {/* 工具条 */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button
          type="button"
          onClick={onCreateBlank}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-[620] cursor-pointer",
            "border-line bg-white/60 text-foreground hover:bg-white/80 transition-[background] duration-150"
          )}
        >
          <Plus className="w-4 h-4" /> 自定义创建
        </button>
        <button
          type="button"
          onClick={onOpenExtract}
          disabled={isExtracting}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-[620] cursor-pointer",
            "border-line bg-white/60 text-foreground hover:bg-white/80 transition-[background] duration-150",
            isExtracting && "opacity-60 cursor-not-allowed"
          )}
        >
          {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isExtracting ? "提取中..." : "AI 从文件提取"}
        </button>

        <div className="flex-1" />
        <span className="text-xs text-subtle">共 {totalCount} 个模板</span>
        <select
          value={source}
          onChange={(e) => onSource(e.target.value as SourceFilter)}
          className="h-8 px-2 border border-line rounded-lg text-sm bg-white/60 text-foreground focus:outline-none focus:border-[rgba(200,60,78,0.36)] transition-[border-color] duration-150 cursor-pointer"
        >
          <option value="all">全部来源</option>
          <option value="preset">预设</option>
          <option value="custom">自定义</option>
          <option value="file">文件提取</option>
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="搜索模板..."
          className="w-[200px] h-8 px-3 border border-line rounded-lg text-sm bg-white/60 placeholder:text-subtle focus:outline-none focus:border-[rgba(200,60,78,0.36)] transition-[border-color] duration-150"
        />
      </div>

      {/* 错误条 */}
      {extractError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-[rgba(200,60,78,0.24)] bg-accent-faint px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-accent-deep flex-none mt-0.5" />
          <span className="flex-1 text-xs text-accent-deep leading-relaxed">{extractError}</span>
          <button type="button" onClick={onDismissError} className="text-accent-deep/60 hover:text-accent-deep cursor-pointer border-0 bg-transparent p-0" title="关闭">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 列表 */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 grid place-items-center rounded-2xl bg-[#f5ede8] mb-4">
            {kind === "structure"
              ? <LayoutGrid className="w-7 h-7 text-[#c4b5aa]" />
              : <Palette className="w-7 h-7 text-[#c4b5aa]" />}
          </div>
          <p className="text-sm text-muted-text">暂无模板</p>
          <p className="text-xs text-subtle mt-1">点击&ldquo;自定义创建&rdquo;或&ldquo;AI 从文件提取&rdquo;来添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const label = sourceLabelOf(t)
            return (
              <div key={t.id} className="bg-white/80 border border-line rounded-2xl p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-[680] text-foreground truncate flex-1">{t.name}</h3>
                  <span className={cn(
                    "text-[10px] font-[660] px-1.5 py-0.5 rounded flex-none",
                    label === "预设" ? "bg-primary/10 text-primary" : "bg-accent-soft text-accent-deep"
                  )}>{label}</span>
                </div>
                <p className="text-xs text-muted-text mb-1">
                  {kind === "structure"
                    ? "结构模板"
                    : "风格模板"}
                </p>
                <p className="text-[11px] text-subtle mb-4">
                  更新于 {formatDate(t.updatedAt)}
                </p>
                <div className="mt-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(t)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-[620] border border-accent-deep/30 bg-accent-soft/50 text-accent-deep hover:bg-accent-soft cursor-pointer transition-[background] duration-150"
                  >
                    <Pencil className="w-3.5 h-3.5" /> 编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopy(t)}
                    title="复制副本"
                    className="inline-flex items-center justify-center px-2.5 py-2 rounded-xl text-sm font-[620] border border-line bg-white/60 text-muted-text hover:text-foreground hover:bg-white/80 cursor-pointer transition-[background,color] duration-150"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(t)}
                    title="删除"
                    className="inline-flex items-center justify-center px-2.5 py-2 rounded-xl text-sm font-[620] border border-transparent bg-transparent text-muted-text hover:text-accent-deep hover:bg-accent-faint cursor-pointer transition-[background,color] duration-150"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  另存为新模板 命名弹窗                                              */
/* ================================================================== */

function SaveAsNewDialog({
  open, name, onName, onOpenChange, onConfirm,
}: {
  open: boolean
  name: string
  onName: (v: string) => void
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-xl p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-2 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-left text-base font-semibold tracking-tight">另存为新模板</DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">请输入新模板的名称:</DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={name}
            onChange={(e) => onName(e.target.value)}
            className="w-full h-9 px-3 border border-line rounded-lg text-sm bg-white/60 focus:outline-none focus:border-[rgba(200,60,78,0.36)] transition-[border-color] duration-150"
            autoFocus
          />
        </div>
        <DialogFooter className="flex-row justify-end gap-2 px-6 pb-6 pt-4">
          <DialogClose render={(props: React.ComponentProps<"button">) => <Button variant="outline" size="default" {...props} />}>取消</DialogClose>
          <Button size="default" onClick={onConfirm} disabled={!name.trim()}>确认创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ================================================================== */
/*  helpers                                                            */
/* ================================================================== */

function formatDate(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
