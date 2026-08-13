"use client"

import { useState, useCallback } from "react"
import {
  LayoutGrid, Palette, Plus, Upload, FileText,
  ArrowLeft, Save, Copy, Loader2, X, Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type TemplateSection,
  type WritingTemplate,
  mockExtractFromFile,
  loadSavedTemplates,
  saveTemplates,
  createBlankTemplate,
} from "@/data/template"
import {
  type StyleDimension,
  type StyleTemplate,
  mockExtractStyleFromFile,
  loadSavedStyleTemplates,
  saveStyleTemplates,
  createBlankStyleTemplate,
} from "@/data/style"
import { SectionCard, validateSectionWordRange } from "@/components/section-card"
import { DimensionCard } from "@/components/dimension-card"
import { TemplateLibraryCard } from "@/components/template-library-card"
import { StyleLibraryCard } from "@/components/style-library-card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  Dialog, DialogClose, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                */
/* ------------------------------------------------------------------ */

type Tab = "structure" | "style"
const MAX_TEMPLATES = 10
const MAX_PINNED = 3
const uid = () => crypto.randomUUID()

function loadPinnedIds(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]") } catch { return [] }
}
function savePinnedIds(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify(ids))
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function TemplateLibraryView() {
  const [activeTab, setActiveTab] = useState<Tab>("structure")

  /* ── Structure template state ── */
  const [structTemplates, setStructTemplates] = useState<WritingTemplate[]>(() => loadSavedTemplates())
  const [structPinnedIds, setStructPinnedIds] = useState<string[]>(() => loadPinnedIds("template-library-struct-pinned"))
  const [structEditing, setStructEditing] = useState<WritingTemplate | null>(null)
  const [structReadOnly, setStructReadOnly] = useState(false)
  const [structSnapshot, setStructSnapshot] = useState<WritingTemplate | null>(null)
  const [structUploadName, setStructUploadName] = useState<string | null>(null)
  const [structExtracting, setStructExtracting] = useState(false)
  const [structDeleteTarget, setStructDeleteTarget] = useState<WritingTemplate | null>(null)
  const [structSearch, setStructSearch] = useState("")
  const [structSaveAsNewOpen, setStructSaveAsNewOpen] = useState(false)
  const [structSaveAsNewName, setStructSaveAsNewName] = useState("")

  /* ── Style template state ── */
  const [styleTemplates, setStyleTemplates] = useState<StyleTemplate[]>(() => loadSavedStyleTemplates())
  const [stylePinnedIds, setStylePinnedIds] = useState<string[]>(() => loadPinnedIds("template-library-style-pinned"))
  const [styleEditing, setStyleEditing] = useState<StyleTemplate | null>(null)
  const [styleReadOnly, setStyleReadOnly] = useState(false)
  const [styleSnapshot, setStyleSnapshot] = useState<StyleTemplate | null>(null)
  const [styleUploadName, setStyleUploadName] = useState<string | null>(null)
  const [styleExtracting, setStyleExtracting] = useState(false)
  const [styleDeleteTarget, setStyleDeleteTarget] = useState<StyleTemplate | null>(null)
  const [styleSearch, setStyleSearch] = useState("")
  const [styleSaveAsNewOpen, setStyleSaveAsNewOpen] = useState(false)
  const [styleSaveAsNewName, setStyleSaveAsNewName] = useState("")

  /* ── Structure helpers ── */
  const persistStruct = useCallback((next: WritingTemplate[]) => {
    setStructTemplates(next)
    saveTemplates(next)
  }, [])

  const persistStructPinned = useCallback((ids: string[]) => {
    setStructPinnedIds(ids)
    savePinnedIds("template-library-struct-pinned", ids)
  }, [])

  const structUpdateSection = useCallback((id: string, patch: Partial<TemplateSection>) => {
    setStructEditing((prev) =>
      prev ? { ...prev, sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) } : null
    )
  }, [])

  const structAddSection = useCallback(() => {
    setStructEditing((prev) => {
      if (!prev) return null
      return { ...prev, sections: [...prev.sections, { id: uid(), title: "", fixedTitle: false, required: true, generationHint: "", wordCountMin: null, wordCountMax: null, order: prev.sections.length }] }
    })
  }, [])

  const structRemoveSection = useCallback((id: string) => {
    setStructEditing((prev) => {
      if (!prev) return null
      return { ...prev, sections: prev.sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })) }
    })
  }, [])

  const structMoveSection = useCallback((id: string, direction: "up" | "down") => {
    setStructEditing((prev) => {
      if (!prev) return null
      const arr = [...prev.sections]
      const idx = arr.findIndex((s) => s.id === id)
      if (idx < 0) return prev
      const swapIdx = direction === "up" ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= arr.length) return prev
      ;[arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]]
      return { ...prev, sections: arr.map((s, i) => ({ ...s, order: i })) }
    })
  }, [])

  const handleStructSave = useCallback(() => {
    if (!structEditing) return
    const now = new Date().toISOString()
    const updated = { ...structEditing, updatedAt: now }
    const exists = structTemplates.some((t) => t.id === updated.id)
    if (exists) {
      persistStruct(structTemplates.map((t) => (t.id === updated.id ? updated : t)))
    } else {
      if (structTemplates.length >= MAX_TEMPLATES) return
      persistStruct([...structTemplates, updated])
    }
    // After save, go back to read-only
    setStructEditing(updated)
    setStructSnapshot(updated)
    setStructReadOnly(true)
  }, [structEditing, structTemplates, persistStruct])

  const handleStructSaveAsNewConfirm = useCallback(() => {
    if (!structEditing || structTemplates.length >= MAX_TEMPLATES) return
    const name = structSaveAsNewName.trim() || "未命名模板"
    const now = new Date().toISOString()
    const newT: WritingTemplate = { ...structEditing, id: uid(), name, source: "custom", createdAt: now, updatedAt: now }
    persistStruct([...structTemplates, newT])
    setStructEditing(newT)
    setStructSnapshot(newT)
    setStructReadOnly(true)
    setStructSaveAsNewOpen(false)
  }, [structEditing, structTemplates, persistStruct, structSaveAsNewName])

  const handleStructDelete = useCallback(() => {
    if (!structDeleteTarget) return
    const next = structTemplates.filter((t) => t.id !== structDeleteTarget.id)
    persistStruct(next)
    if (structPinnedIds.includes(structDeleteTarget.id)) {
      persistStructPinned(structPinnedIds.filter((id) => id !== structDeleteTarget.id))
    }
    if (structEditing?.id === structDeleteTarget.id) {
      setStructEditing(null)
      setStructSnapshot(null)
      setStructReadOnly(false)
    }
    setStructDeleteTarget(null)
  }, [structDeleteTarget, structTemplates, structEditing, persistStruct, structPinnedIds, persistStructPinned])

  const handleStructExtract = useCallback(async () => {
    if (!structUploadName) return
    setStructExtracting(true)
    try {
      const template = await mockExtractFromFile(structUploadName)
      setStructEditing(template)
      setStructSnapshot(null)
      setStructReadOnly(false)
      setStructUploadName(null)
    } finally {
      setStructExtracting(false)
    }
  }, [structUploadName])

  const handleStructCopy = useCallback((template: WritingTemplate) => {
    if (structTemplates.length >= MAX_TEMPLATES) return
    const now = new Date().toISOString()
    const copy: WritingTemplate = {
      ...template,
      id: uid(),
      name: `${template.name} (副本)`,
      source: "custom",
      createdAt: now,
      updatedAt: now,
    }
    persistStruct([...structTemplates, copy])
  }, [structTemplates, persistStruct])

  const handleStructPin = useCallback((template: WritingTemplate) => {
    if (structPinnedIds.length >= MAX_PINNED || structPinnedIds.includes(template.id)) return
    persistStructPinned([template.id, ...structPinnedIds])
  }, [structPinnedIds, persistStructPinned])

  const handleStructUnpin = useCallback((template: WritingTemplate) => {
    persistStructPinned(structPinnedIds.filter((id) => id !== template.id))
  }, [structPinnedIds, persistStructPinned])

  const enterStructEdit = useCallback((t: WritingTemplate) => {
    setStructEditing(t)
    setStructSnapshot(t)
    setStructReadOnly(false)
  }, [])

  const cancelStructEdit = useCallback(() => {
    if (structSnapshot) {
      setStructEditing(structSnapshot)
      setStructReadOnly(true)
    }
  }, [structSnapshot])

  /* ── Style helpers ── */
  const persistStyle = useCallback((next: StyleTemplate[]) => {
    setStyleTemplates(next)
    saveStyleTemplates(next)
  }, [])

  const persistStylePinned = useCallback((ids: string[]) => {
    setStylePinnedIds(ids)
    savePinnedIds("template-library-style-pinned", ids)
  }, [])

  const styleUpdateDimension = useCallback((id: string, patch: Partial<StyleDimension>) => {
    setStyleEditing((prev) =>
      prev ? { ...prev, dimensions: prev.dimensions.map((d) => (d.id === id ? { ...d, ...patch } : d)) } : null
    )
  }, [])

  const styleAddDimension = useCallback(() => {
    setStyleEditing((prev) => {
      if (!prev) return null
      return { ...prev, dimensions: [...prev.dimensions, { id: uid(), name: "", value: "", fixedName: false, required: true, order: prev.dimensions.length }] }
    })
  }, [])

  const styleRemoveDimension = useCallback((id: string) => {
    setStyleEditing((prev) => {
      if (!prev) return null
      return { ...prev, dimensions: prev.dimensions.filter((d) => d.id !== id).map((d, i) => ({ ...d, order: i })) }
    })
  }, [])

  const styleMoveDimension = useCallback((id: string, direction: "up" | "down") => {
    setStyleEditing((prev) => {
      if (!prev) return null
      const arr = [...prev.dimensions]
      const idx = arr.findIndex((d) => d.id === id)
      if (idx < 0) return prev
      const swapIdx = direction === "up" ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= arr.length) return prev
      ;[arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]]
      return { ...prev, dimensions: arr.map((d, i) => ({ ...d, order: i })) }
    })
  }, [])

  const handleStyleSave = useCallback(() => {
    if (!styleEditing) return
    const now = new Date().toISOString()
    const updated = { ...styleEditing, updatedAt: now }
    const exists = styleTemplates.some((t) => t.id === updated.id)
    if (exists) {
      persistStyle(styleTemplates.map((t) => (t.id === updated.id ? updated : t)))
    } else {
      if (styleTemplates.length >= MAX_TEMPLATES) return
      persistStyle([...styleTemplates, updated])
    }
    setStyleEditing(updated)
    setStyleSnapshot(updated)
    setStyleReadOnly(true)
  }, [styleEditing, styleTemplates, persistStyle])

  const handleStyleSaveAsNewConfirm = useCallback(() => {
    if (!styleEditing || styleTemplates.length >= MAX_TEMPLATES) return
    const name = styleSaveAsNewName.trim() || "未命名模板"
    const now = new Date().toISOString()
    const newT: StyleTemplate = { ...styleEditing, id: uid(), name, source: "custom", createdAt: now, updatedAt: now }
    persistStyle([...styleTemplates, newT])
    setStyleEditing(newT)
    setStyleSnapshot(newT)
    setStyleReadOnly(true)
    setStyleSaveAsNewOpen(false)
  }, [styleEditing, styleTemplates, persistStyle, styleSaveAsNewName])

  const handleStyleDelete = useCallback(() => {
    if (!styleDeleteTarget) return
    const next = styleTemplates.filter((t) => t.id !== styleDeleteTarget.id)
    persistStyle(next)
    if (stylePinnedIds.includes(styleDeleteTarget.id)) {
      persistStylePinned(stylePinnedIds.filter((id) => id !== styleDeleteTarget.id))
    }
    if (styleEditing?.id === styleDeleteTarget.id) {
      setStyleEditing(null)
      setStyleSnapshot(null)
      setStyleReadOnly(false)
    }
    setStyleDeleteTarget(null)
  }, [styleDeleteTarget, styleTemplates, styleEditing, persistStyle, stylePinnedIds, persistStylePinned])

  const handleStyleExtract = useCallback(async () => {
    if (!styleUploadName) return
    setStyleExtracting(true)
    try {
      const template = await mockExtractStyleFromFile(styleUploadName)
      setStyleEditing(template)
      setStyleSnapshot(null)
      setStyleReadOnly(false)
      setStyleUploadName(null)
    } finally {
      setStyleExtracting(false)
    }
  }, [styleUploadName])

  const handleStyleCopy = useCallback((template: StyleTemplate) => {
    if (styleTemplates.length >= MAX_TEMPLATES) return
    const now = new Date().toISOString()
    const copy: StyleTemplate = {
      ...template,
      id: uid(),
      name: `${template.name} (副本)`,
      source: "custom",
      createdAt: now,
      updatedAt: now,
    }
    persistStyle([...styleTemplates, copy])
  }, [styleTemplates, persistStyle])

  const handleStylePin = useCallback((template: StyleTemplate) => {
    if (stylePinnedIds.length >= MAX_PINNED || stylePinnedIds.includes(template.id)) return
    persistStylePinned([template.id, ...stylePinnedIds])
  }, [stylePinnedIds, persistStylePinned])

  const handleStyleUnpin = useCallback((template: StyleTemplate) => {
    persistStylePinned(stylePinnedIds.filter((id) => id !== template.id))
  }, [stylePinnedIds, persistStylePinned])

  const enterStyleEdit = useCallback((t: StyleTemplate) => {
    setStyleEditing(t)
    setStyleSnapshot(t)
    setStyleReadOnly(false)
  }, [])

  const cancelStyleEdit = useCallback(() => {
    if (styleSnapshot) {
      setStyleEditing(styleSnapshot)
      setStyleReadOnly(true)
    }
  }, [styleSnapshot])

  /* ── Sorted & filtered lists ── */
  const sortedStruct = [...structTemplates].sort((a, b) => {
    const aPinned = structPinnedIds.includes(a.id)
    const bPinned = structPinnedIds.includes(b.id)
    if (aPinned && !bPinned) return -1
    if (!aPinned && bPinned) return 1
    return 0
  })
  const filteredStruct = sortedStruct.filter((t) =>
    !structSearch.trim() || t.name.toLowerCase().includes(structSearch.toLowerCase())
  )

  const sortedStyle = [...styleTemplates].sort((a, b) => {
    const aPinned = stylePinnedIds.includes(a.id)
    const bPinned = stylePinnedIds.includes(b.id)
    if (aPinned && !bPinned) return -1
    if (!aPinned && bPinned) return 1
    return 0
  })
  const filteredStyle = sortedStyle.filter((t) =>
    !styleSearch.trim() || t.name.toLowerCase().includes(styleSearch.toLowerCase())
  )

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <section className="w-[min(1120px,100%)] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[27px] tracking-[-0.03em]">模板库</h1>
        <p className="mt-2 text-muted-text text-[13px] leading-relaxed">
          管理和复用结构模板与风格模板，支持自定义创建和 AI 智能提取
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { key: "structure" as Tab, label: "结构模板", icon: LayoutGrid },
          { key: "style" as Tab, label: "风格模板", icon: Palette },
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

      {/* Tab content */}
      {activeTab === "structure" ? (
        structEditing ? (
          <StructureEditPanel
            template={structEditing}
            readOnly={structReadOnly}
            isPreset={structEditing.id.startsWith("preset-")}
            onUpdateTemplate={setStructEditing}
            onUpdateSection={structUpdateSection}
            onAddSection={structAddSection}
            onRemoveSection={structRemoveSection}
            onMoveSection={structMoveSection}
            onSave={handleStructSave}
            onSaveAsNew={() => { setStructSaveAsNewName(structEditing.name ? `${structEditing.name} (副本)` : "未命名模板"); setStructSaveAsNewOpen(true) }}
            onBack={() => { setStructEditing(null); setStructSnapshot(null); setStructReadOnly(false) }}
            onSwitchToEdit={() => enterStructEdit(structEditing)}
            onCancelEdit={cancelStructEdit}
            canSaveAsNew={structTemplates.length < MAX_TEMPLATES}
          />
        ) : (
          <StructureBrowsePanel
            templates={filteredStruct}
            totalCount={structTemplates.length}
            pinnedIds={structPinnedIds}
            search={structSearch}
            onSearch={setStructSearch}
            uploadName={structUploadName}
            onUploadName={setStructUploadName}
            isExtracting={structExtracting}
            onExtract={handleStructExtract}
            onCreateCustom={() => { setStructEditing(createBlankTemplate()); setStructSnapshot(null); setStructReadOnly(false) }}
            onView={(t) => { setStructEditing(t); setStructSnapshot(t); setStructReadOnly(true) }}
            onCopy={handleStructCopy}
            onPin={handleStructPin}
            onUnpin={handleStructUnpin}
            onDelete={setStructDeleteTarget}
          />
        )
      ) : (
        styleEditing ? (
          <StyleEditPanel
            template={styleEditing}
            readOnly={styleReadOnly}
            isPreset={styleEditing.id.startsWith("preset-")}
            onUpdateTemplate={setStyleEditing}
            onUpdateDimension={styleUpdateDimension}
            onAddDimension={styleAddDimension}
            onRemoveDimension={styleRemoveDimension}
            onMoveDimension={styleMoveDimension}
            onSave={handleStyleSave}
            onSaveAsNew={() => { setStyleSaveAsNewName(styleEditing.name ? `${styleEditing.name} (副本)` : "未命名模板"); setStyleSaveAsNewOpen(true) }}
            onBack={() => { setStyleEditing(null); setStyleSnapshot(null); setStyleReadOnly(false) }}
            onSwitchToEdit={() => enterStyleEdit(styleEditing)}
            onCancelEdit={cancelStyleEdit}
            canSaveAsNew={styleTemplates.length < MAX_TEMPLATES}
          />
        ) : (
          <StyleBrowsePanel
            templates={filteredStyle}
            totalCount={styleTemplates.length}
            pinnedIds={stylePinnedIds}
            search={styleSearch}
            onSearch={setStyleSearch}
            uploadName={styleUploadName}
            onUploadName={setStyleUploadName}
            isExtracting={styleExtracting}
            onExtract={handleStyleExtract}
            onCreateCustom={() => { setStyleEditing(createBlankStyleTemplate()); setStyleSnapshot(null); setStyleReadOnly(false) }}
            onView={(t) => { setStyleEditing(t); setStyleSnapshot(t); setStyleReadOnly(true) }}
            onCopy={handleStyleCopy}
            onPin={handleStylePin}
            onUnpin={handleStyleUnpin}
            onDelete={setStyleDeleteTarget}
          />
        )
      )}

      {/* Delete confirmation dialogs */}
      <ConfirmDialog
        open={structDeleteTarget !== null}
        onOpenChange={(open) => { if (!open) setStructDeleteTarget(null) }}
        title="删除模板"
        description={`确定删除模板「${structDeleteTarget?.name}」吗？此操作不可撤销。`}
        variant="destructive"
        onConfirm={handleStructDelete}
      />
      <ConfirmDialog
        open={styleDeleteTarget !== null}
        onOpenChange={(open) => { if (!open) setStyleDeleteTarget(null) }}
        title="删除模板"
        description={`确定删除模板「${styleDeleteTarget?.name}」吗？此操作不可撤销。`}
        variant="destructive"
        onConfirm={handleStyleDelete}
      />

      {/* Save-as-new dialog — structure */}
      <Dialog open={structSaveAsNewOpen} onOpenChange={setStructSaveAsNewOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-2 space-y-3">
            <DialogHeader>
              <DialogTitle className="text-left text-base font-semibold tracking-tight">另存为新模板</DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">请输入新模板的名称：</DialogDescription>
            </DialogHeader>
            <input
              type="text"
              value={structSaveAsNewName}
              onChange={(e) => setStructSaveAsNewName(e.target.value)}
              className="w-full h-9 px-3 border border-line rounded-lg text-sm bg-white/60 focus:outline-none focus:border-[rgba(200,60,78,0.36)] transition-[border-color] duration-150"
              autoFocus
            />
          </div>
          <DialogFooter className="flex-row justify-end gap-2 px-6 pb-6 pt-4">
            <DialogClose render={(props: React.ComponentProps<"button">) => <Button variant="outline" size="default" {...props} />}>取消</DialogClose>
            <Button size="default" onClick={handleStructSaveAsNewConfirm} disabled={!structSaveAsNewName.trim()}>确认创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save-as-new dialog — style */}
      <Dialog open={styleSaveAsNewOpen} onOpenChange={setStyleSaveAsNewOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-2 space-y-3">
            <DialogHeader>
              <DialogTitle className="text-left text-base font-semibold tracking-tight">另存为新模板</DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">请输入新模板的名称：</DialogDescription>
            </DialogHeader>
            <input
              type="text"
              value={styleSaveAsNewName}
              onChange={(e) => setStyleSaveAsNewName(e.target.value)}
              className="w-full h-9 px-3 border border-line rounded-lg text-sm bg-white/60 focus:outline-none focus:border-[rgba(200,60,78,0.36)] transition-[border-color] duration-150"
              autoFocus
            />
          </div>
          <DialogFooter className="flex-row justify-end gap-2 px-6 pb-6 pt-4">
            <DialogClose render={(props: React.ComponentProps<"button">) => <Button variant="outline" size="default" {...props} />}>取消</DialogClose>
            <Button size="default" onClick={handleStyleSaveAsNewConfirm} disabled={!styleSaveAsNewName.trim()}>确认创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

/* ================================================================== */
/*  Shared action bar                                                  */
/* ================================================================== */

function ActionBar({
  onCreateCustom,
  uploadName,
  onUploadName,
  isExtracting,
  onExtract,
  totalCount,
  search,
  onSearch,
}: {
  onCreateCustom: () => void
  uploadName: string | null
  onUploadName: (v: string | null) => void
  isExtracting: boolean
  onExtract: () => void
  totalCount: number
  search: string
  onSearch: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3 mb-5 flex-wrap">
      <button
        type="button"
        onClick={onCreateCustom}
        className={cn(
          "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-[620] cursor-pointer",
          "border-line bg-white/60 text-foreground hover:bg-white/80",
          "transition-[background] duration-150"
        )}
      >
        <Plus className="w-4 h-4" />
        自定义创建
      </button>

      <div className="flex items-center gap-2">
        <label
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-[620] cursor-pointer",
            "border-line bg-white/60 text-foreground hover:bg-white/80",
            "transition-[background] duration-150",
            uploadName && "border-success bg-[rgba(23,132,94,0.04)]"
          )}
        >
          <Upload className="w-4 h-4" />
          {uploadName ? uploadName : "AI 从文件提取"}
          <input
            type="file"
            accept=".docx,.pdf,.txt"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUploadName(file.name)
            }}
          />
        </label>
        {uploadName && (
          <button
            type="button"
            onClick={onExtract}
            disabled={isExtracting}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-[620] cursor-pointer border",
              "text-white transition-[background,opacity] duration-150",
              isExtracting
                ? "border-line bg-[#c9c3c7] opacity-60 cursor-not-allowed"
                : "border-accent-deep bg-gradient-to-br from-[#cf4657] to-[#aa2639] hover:from-[#c23b4d] hover:to-[#981f32]"
            )}
          >
            {isExtracting ? <><Loader2 className="w-4 h-4 animate-spin" /> 提取中...</> : <><FileText className="w-4 h-4" /> 开始提取</>}
          </button>
        )}
        {uploadName && (
          <button type="button" onClick={() => onUploadName(null)} className="p-1 rounded hover:bg-muted transition-colors cursor-pointer border-0 bg-transparent">
            <X className="w-3.5 h-3.5 text-muted-text" />
          </button>
        )}
      </div>

      <div className="flex-1" />
      <span className="text-xs text-subtle">共 {totalCount} 个模板</span>
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="搜索模板..."
        className="w-[200px] h-8 px-3 border border-line rounded-lg text-sm bg-white/60 placeholder:text-subtle focus:outline-none focus:border-[rgba(200,60,78,0.36)] transition-[border-color] duration-150"
      />
    </div>
  )
}

/* ================================================================== */
/*  Structure browse panel                                            */
/* ================================================================== */

function StructureBrowsePanel({
  templates,
  totalCount,
  pinnedIds,
  search,
  onSearch,
  uploadName,
  onUploadName,
  isExtracting,
  onExtract,
  onCreateCustom,
  onView,
  onCopy,
  onPin,
  onUnpin,
  onDelete,
}: {
  templates: WritingTemplate[]
  totalCount: number
  pinnedIds: string[]
  search: string
  onSearch: (v: string) => void
  uploadName: string | null
  onUploadName: (v: string | null) => void
  isExtracting: boolean
  onExtract: () => void
  onCreateCustom: () => void
  onView: (t: WritingTemplate) => void
  onCopy: (t: WritingTemplate) => void
  onPin: (t: WritingTemplate) => void
  onUnpin: (t: WritingTemplate) => void
  onDelete: (t: WritingTemplate) => void
}) {
  return (
    <div>
      <ActionBar
        onCreateCustom={onCreateCustom}
        uploadName={uploadName}
        onUploadName={onUploadName}
        isExtracting={isExtracting}
        onExtract={onExtract}
        totalCount={totalCount}
        search={search}
        onSearch={onSearch}
      />

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 grid place-items-center rounded-2xl bg-[#f5ede8] mb-4">
            <LayoutGrid className="w-7 h-7 text-[#c4b5aa]" />
          </div>
          <p className="text-sm text-muted-text">暂无结构模板</p>
          <p className="text-xs text-subtle mt-1">点击&ldquo;自定义创建&rdquo;或&ldquo;AI 从文件提取&rdquo;来添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <TemplateLibraryCard
              key={t.id}
              template={t}
              isPinned={pinnedIds.includes(t.id)}
              pinnedCount={pinnedIds.length}
              onView={onView}
              onCopy={onCopy}
              onPin={onPin}
              onUnpin={onUnpin}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  Structure edit panel                                              */
/* ================================================================== */

function StructureEditPanel({
  template,
  readOnly = false,
  isPreset = false,
  onUpdateTemplate,
  onUpdateSection,
  onAddSection,
  onRemoveSection,
  onMoveSection,
  onSave,
  onSaveAsNew,
  onBack,
  onSwitchToEdit,
  onCancelEdit,
  canSaveAsNew,
}: {
  template: WritingTemplate
  readOnly?: boolean
  isPreset?: boolean
  onUpdateTemplate: (t: WritingTemplate) => void
  onUpdateSection: (id: string, patch: Partial<TemplateSection>) => void
  onAddSection: () => void
  onRemoveSection: (id: string) => void
  onMoveSection: (id: string, direction: "up" | "down") => void
  onSave: () => void
  onSaveAsNew: () => void
  onBack: () => void
  onSwitchToEdit?: () => void
  onCancelEdit?: () => void
  canSaveAsNew: boolean
}) {
  const canSave = !readOnly && template.name.trim().length > 0 && template.sections.length > 0 && template.sections.every((s) => s.title.trim().length > 0) && template.sections.every(validateSectionWordRange)

  return (
    <div className="bg-white/80 border border-line rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-[620] text-muted-text hover:text-accent-deep cursor-pointer border-0 bg-transparent transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          返回模板库
        </button>
        {readOnly ? (
          onSwitchToEdit && (
            <button
              type="button"
              onClick={onSwitchToEdit}
              disabled={isPreset}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-[620] border cursor-pointer",
                "transition-[background,border-color,color,opacity] duration-150",
                isPreset
                  ? "border-line text-subtle/40 opacity-50 cursor-not-allowed"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title={isPreset ? "预设模板不可编辑" : "编辑"}
            >
              <Pencil className="w-3.5 h-3.5" />
              编辑
            </button>
          )
        ) : (
          onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-[620] border cursor-pointer",
                "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent",
                "transition-[background,border-color,color] duration-150"
              )}
              title="取消编辑"
            >
              <X className="w-3.5 h-3.5" />
              取消编辑
            </button>
          )
        )}
      </div>

      <div className="mb-5">
        <label className="block text-xs font-[620] text-muted-text mb-1.5">模板名称</label>
        {readOnly ? (
          <p className="h-9 px-4 flex items-center text-sm font-[620] text-foreground">{template.name}</p>
        ) : (
          <input
            type="text"
            value={template.name}
            onChange={(e) => onUpdateTemplate({ ...template, name: e.target.value })}
            placeholder="输入模板名称"
            className={cn(
              "w-full h-9 px-4 border border-line rounded-4xl text-sm",
              "bg-white/60 text-foreground placeholder:text-subtle",
              "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow] duration-150",
              template.name.trim().length === 0 && "border-destructive"
            )}
          />
        )}
      </div>

      {template.sections.length === 0 ? (
        <div className="py-6 text-center text-muted-text text-sm">{readOnly ? "该模板暂无章节" : "请添加至少一个章节"}</div>
      ) : (
        <div className="space-y-3 mb-4">
          {template.sections.map((section, idx) => (
            <SectionCard
              key={section.id}
              section={section}
              index={idx}
              total={template.sections.length}
              readOnly={readOnly}
              onUpdate={onUpdateSection}
              onRemove={onRemoveSection}
              onMove={onMoveSection}
            />
          ))}
        </div>
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={onAddSection}
          className="flex items-center gap-1.5 text-sm font-[620] text-accent-deep cursor-pointer hover:underline mb-5"
        >
          <Plus className="w-4 h-4" /> 添加章节
        </button>
      )}

      {!readOnly && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-[620] cursor-pointer",
              "transition-[background,opacity] duration-150",
              canSave
                ? "border-accent-deep bg-accent-soft text-accent-deep hover:bg-accent-faint"
                : "border-line text-muted-text opacity-50 cursor-not-allowed"
            )}
          >
            <Save className="w-3.5 h-3.5" /> 保存
          </button>
          <button
            type="button"
            onClick={onSaveAsNew}
            disabled={!canSaveAsNew || !canSave}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-[620] cursor-pointer",
              "transition-[background,opacity] duration-150",
              canSaveAsNew && canSave
                ? "border-line bg-white/60 hover:bg-white/80"
                : "border-line text-muted-text opacity-50 cursor-not-allowed"
            )}
          >
            <Copy className="w-3.5 h-3.5" /> 另存为新模板
          </button>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  Style browse panel                                                */
/* ================================================================== */

function StyleBrowsePanel({
  templates,
  totalCount,
  pinnedIds,
  search,
  onSearch,
  uploadName,
  onUploadName,
  isExtracting,
  onExtract,
  onCreateCustom,
  onView,
  onCopy,
  onPin,
  onUnpin,
  onDelete,
}: {
  templates: StyleTemplate[]
  totalCount: number
  pinnedIds: string[]
  search: string
  onSearch: (v: string) => void
  uploadName: string | null
  onUploadName: (v: string | null) => void
  isExtracting: boolean
  onExtract: () => void
  onCreateCustom: () => void
  onView: (t: StyleTemplate) => void
  onCopy: (t: StyleTemplate) => void
  onPin: (t: StyleTemplate) => void
  onUnpin: (t: StyleTemplate) => void
  onDelete: (t: StyleTemplate) => void
}) {
  return (
    <div>
      <ActionBar
        onCreateCustom={onCreateCustom}
        uploadName={uploadName}
        onUploadName={onUploadName}
        isExtracting={isExtracting}
        onExtract={onExtract}
        totalCount={totalCount}
        search={search}
        onSearch={onSearch}
      />

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 grid place-items-center rounded-2xl bg-[#f5ede8] mb-4">
            <Palette className="w-7 h-7 text-[#c4b5aa]" />
          </div>
          <p className="text-sm text-muted-text">暂无风格模板</p>
          <p className="text-xs text-subtle mt-1">点击&ldquo;自定义创建&rdquo;或&ldquo;AI 从文件提取&rdquo;来添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <StyleLibraryCard
              key={t.id}
              template={t}
              isPinned={pinnedIds.includes(t.id)}
              pinnedCount={pinnedIds.length}
              onView={onView}
              onCopy={onCopy}
              onPin={onPin}
              onUnpin={onUnpin}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  Style edit panel                                                  */
/* ================================================================== */

function StyleEditPanel({
  template,
  readOnly = false,
  isPreset = false,
  onUpdateTemplate,
  onUpdateDimension,
  onAddDimension,
  onRemoveDimension,
  onMoveDimension,
  onSave,
  onSaveAsNew,
  onBack,
  onSwitchToEdit,
  onCancelEdit,
  canSaveAsNew,
}: {
  template: StyleTemplate
  readOnly?: boolean
  isPreset?: boolean
  onUpdateTemplate: (t: StyleTemplate) => void
  onUpdateDimension: (id: string, patch: Partial<StyleDimension>) => void
  onAddDimension: () => void
  onRemoveDimension: (id: string) => void
  onMoveDimension: (id: string, direction: "up" | "down") => void
  onSave: () => void
  onSaveAsNew: () => void
  onBack: () => void
  onSwitchToEdit?: () => void
  onCancelEdit?: () => void
  canSaveAsNew: boolean
}) {
  const canSave = !readOnly && template.name.trim().length > 0 && template.dimensions.length > 0 && template.dimensions.every((d) => d.name.trim().length > 0 && d.value.trim().length > 0)

  return (
    <div className="bg-white/80 border border-line rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-[620] text-muted-text hover:text-accent-deep cursor-pointer border-0 bg-transparent transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          返回模板库
        </button>
        {readOnly ? (
          onSwitchToEdit && (
            <button
              type="button"
              onClick={onSwitchToEdit}
              disabled={isPreset}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-[620] border cursor-pointer",
                "transition-[background,border-color,color,opacity] duration-150",
                isPreset
                  ? "border-line text-subtle/40 opacity-50 cursor-not-allowed"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title={isPreset ? "预设模板不可编辑" : "编辑"}
            >
              <Pencil className="w-3.5 h-3.5" />
              编辑
            </button>
          )
        ) : (
          onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-[620] border cursor-pointer",
                "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent",
                "transition-[background,border-color,color] duration-150"
              )}
              title="取消编辑"
            >
              <X className="w-3.5 h-3.5" />
              取消编辑
            </button>
          )
        )}
      </div>

      <div className="mb-5">
        <label className="block text-xs font-[620] text-muted-text mb-1.5">模板名称</label>
        {readOnly ? (
          <p className="h-9 px-4 flex items-center text-sm font-[620] text-foreground">{template.name}</p>
        ) : (
          <input
            type="text"
            value={template.name}
            onChange={(e) => onUpdateTemplate({ ...template, name: e.target.value })}
            placeholder="输入模板名称"
            className={cn(
              "w-full h-9 px-4 border border-line rounded-4xl text-sm",
              "bg-white/60 text-foreground placeholder:text-subtle",
              "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow] duration-150",
              template.name.trim().length === 0 && "border-destructive"
            )}
          />
        )}
      </div>

      {template.dimensions.length === 0 ? (
        <div className="py-6 text-center text-muted-text text-sm">{readOnly ? "该模板暂无维度" : "请添加至少一个风格维度"}</div>
      ) : (
        <div className="space-y-3 mb-4">
          {template.dimensions.map((dim, idx) => (
            <DimensionCard
              key={dim.id}
              dimension={dim}
              index={idx}
              total={template.dimensions.length}
              readOnly={readOnly}
              onUpdate={onUpdateDimension}
              onRemove={onRemoveDimension}
              onMove={onMoveDimension}
            />
          ))}
        </div>
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={onAddDimension}
          className="flex items-center gap-1.5 text-sm font-[620] text-accent-deep cursor-pointer hover:underline mb-5"
        >
          <Plus className="w-4 h-4" /> 添加维度
        </button>
      )}

      <div className="mb-5">
        <label className="block text-xs font-[620] text-muted-text mb-1.5">风格补充说明</label>
        {readOnly ? (
          <p className="min-h-[60px] px-4 py-3 text-sm leading-relaxed text-foreground">{template.styleNote || "无"}</p>
        ) : (
          <textarea
            value={template.styleNote}
            onChange={(e) => onUpdateTemplate({ ...template, styleNote: e.target.value })}
            placeholder="描述整体风格特征、表达习惯等..."
            className={cn(
              "w-full min-h-[100px] border border-line rounded-xl p-4 text-sm leading-relaxed",
              "bg-white/60 text-foreground placeholder:text-subtle",
              "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow] duration-150 resize-y"
            )}
          />
        )}
      </div>

      {!readOnly && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-[620] cursor-pointer",
              "transition-[background,opacity] duration-150",
              canSave
                ? "border-accent-deep bg-accent-soft text-accent-deep hover:bg-accent-faint"
                : "border-line text-muted-text opacity-50 cursor-not-allowed"
            )}
          >
            <Save className="w-3.5 h-3.5" /> 保存
          </button>
          <button
            type="button"
            onClick={onSaveAsNew}
            disabled={!canSaveAsNew || !canSave}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-[620] cursor-pointer",
              "transition-[background,opacity] duration-150",
              canSaveAsNew && canSave
                ? "border-line bg-white/60 hover:bg-white/80"
                : "border-line text-muted-text opacity-50 cursor-not-allowed"
            )}
          >
            <Copy className="w-3.5 h-3.5" /> 另存为新模板
          </button>
        </div>
      )}
    </div>
  )
}
