"use client"

import { useState, useCallback } from "react"
import {
  LayoutGrid, Palette, Plus, Upload, FileText,
  ArrowLeft, Save, Copy, Loader2, X, Pencil,
  ChevronUp, ChevronDown,
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
  type StyleTemplate,
  type StyleSpec,
  type DocumentType,
  type Direction,
  mockExtractStyleFromFile,
  loadSavedStyleTemplates,
  saveStyleTemplates,
  createBlankStyleTemplate,
  recommendedSpecFor,
} from "@/data/style"
import { SectionCard, validateSectionWordRange, validateSectionWritingContent } from "@/components/section-card"
import { TemplateLibraryCard } from "@/components/template-library-card"
import { StyleLibraryCard } from "@/components/style-library-card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  Dialog, DialogClose, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAppState } from "@/hooks/use-app-state"
import type { KnowledgeFile } from "@/types"

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

/**
 * Split a flat, physically-grouped section list into groups.
 * Each group is [level-1 parent, ...its level-2 children] in array order.
 */
function toGroups(sections: TemplateSection[]): TemplateSection[][] {
  const groups: TemplateSection[][] = []
  let current: TemplateSection[] = []
  for (const s of sections) {
    if (s.level === 1) {
      if (current.length) groups.push(current)
      current = [s]
    } else {
      // orphan level-2 (parent removed) — treat as its own group header-less; skip safely
      if (current.length === 0) {
        current = [{ ...s, level: 1, parentId: null }]
      } else {
        current.push(s)
      }
    }
  }
  if (current.length) groups.push(current)
  return groups
}

function fromGroups(groups: TemplateSection[][]): TemplateSection[] {
  return groups.flat()
}

/** Reassign sequential `order` across the flat list. */
function reindex(sections: TemplateSection[]): TemplateSection[] {
  return sections.map((s, i) => ({ ...s, order: i }))
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function TemplateLibraryView() {
  const [activeTab, setActiveTab] = useState<Tab>("structure")
  const state = useAppState()

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
      const section: TemplateSection = {
        id: uid(), title: "", fixedTitle: false, required: true,
        level: 1, parentId: null, writingMode: "prompt",
        generationHint: "", fillTemplate: "", referenceFiles: [],
        wordCountMin: null, wordCountMax: null, order: prev.sections.length,
      }
      return { ...prev, sections: [...prev.sections, section] }
    })
  }, [])

  const structAddSubsection = useCallback((parentId: string) => {
    setStructEditing((prev) => {
      if (!prev) return null
      const groups = toGroups(prev.sections)
      const gi = groups.findIndex((g) => g[0].id === parentId)
      if (gi < 0) return prev
      const sub: TemplateSection = {
        id: uid(), title: "", fixedTitle: false, required: true,
        level: 2, parentId, writingMode: "prompt",
        generationHint: "", fillTemplate: "", referenceFiles: [],
        wordCountMin: null, wordCountMax: null, order: 0,
      }
      const group = [...groups[gi], sub]
      const nextGroups = [...groups.slice(0, gi), group, ...groups.slice(gi + 1)]
      return { ...prev, sections: reindex(fromGroups(nextGroups)) }
    })
  }, [])

  const structPromoteSection = useCallback((id: string) => {
    setStructEditing((prev) => {
      if (!prev) return null
      const groups = toGroups(prev.sections)
      for (let gi = 0; gi < groups.length; gi++) {
        const idx = groups[gi].findIndex((s) => s.id === id)
        if (idx > 0) {
          // remove from current group, insert as its own new group right after
          const [promoted] = groups[gi].splice(idx, 1)
          const newGroup: TemplateSection[] = [{ ...promoted, level: 1, parentId: null }]
          const nextGroups = [...groups.slice(0, gi + 1), newGroup, ...groups.slice(gi + 1)]
          return { ...prev, sections: reindex(fromGroups(nextGroups)) }
        }
      }
      return prev
    })
  }, [])

  const structDemoteSection = useCallback((id: string) => {
    setStructEditing((prev) => {
      if (!prev) return null
      const groups = toGroups(prev.sections)
      const gi = groups.findIndex((g) => g[0].id === id && g[0].level === 1)
      // need a group below to attach to as its first sub-section
      if (gi < 0 || gi >= groups.length - 1) return prev
      const targetParent = groups[gi + 1][0]
      // the whole current group (parent + its existing children) becomes children
      // of the next group's parent, inserted right after it (i.e. as the first subs).
      const moved: TemplateSection[] = groups[gi].map((s) => ({
        ...s, level: 2, parentId: targetParent.id,
      }))
      const newTargetGroup = [groups[gi + 1][0], ...moved, ...groups[gi + 1].slice(1)]
      const nextGroups = [...groups.slice(0, gi), newTargetGroup, ...groups.slice(gi + 2)]
      return { ...prev, sections: reindex(fromGroups(nextGroups)) }
    })
  }, [])

  const structRemoveSection = useCallback((id: string) => {
    setStructEditing((prev) => {
      if (!prev) return null
      const target = prev.sections.find((s) => s.id === id)
      if (!target) return prev
      let next: TemplateSection[]
      if (target.level === 1) {
        // remove the whole group (parent + its children)
        next = prev.sections.filter((s) => s.id !== id && s.parentId !== id)
      } else {
        next = prev.sections.filter((s) => s.id !== id)
      }
      return { ...prev, sections: reindex(next) }
    })
  }, [])

  const structMoveSection = useCallback((id: string, direction: "up" | "down") => {
    setStructEditing((prev) => {
      if (!prev) return null
      const groups = toGroups(prev.sections)
      // locate section
      let gi = -1, si = -1
      for (let i = 0; i < groups.length; i++) {
        const j = groups[i].findIndex((s) => s.id === id)
        if (j >= 0) { gi = i; si = j; break }
      }
      if (gi < 0) return prev

      if (si === 0) {
        // move whole group up/down
        const swap = direction === "up" ? gi - 1 : gi + 1
        if (swap < 0 || swap >= groups.length) return prev
        const nextGroups = [...groups]
        ;[nextGroups[gi], nextGroups[swap]] = [nextGroups[swap], nextGroups[gi]]
        return { ...prev, sections: reindex(fromGroups(nextGroups)) }
      } else {
        // move sub-section within its sibling group
        const group = groups[gi]
        const swap = direction === "up" ? si - 1 : si + 1
        if (swap <= 0 || swap >= group.length) return prev // can't cross the parent
        const nextGroup = [...group]
        ;[nextGroup[si], nextGroup[swap]] = [nextGroup[swap], nextGroup[si]]
        const nextGroups = [...groups.slice(0, gi), nextGroup, ...groups.slice(gi + 1)]
        return { ...prev, sections: reindex(fromGroups(nextGroups)) }
      }
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
      // editing an existing template — revert to the saved snapshot, read-only
      setStructEditing(structSnapshot)
      setStructReadOnly(true)
    } else {
      // canceling a brand-new (unsaved) template — go back to the list
      setStructEditing(null)
      setStructSnapshot(null)
      setStructReadOnly(false)
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

  const styleUpdateSpec = useCallback((patch: Partial<StyleSpec>) => {
    setStyleEditing((prev) => (prev ? { ...prev, styleSpec: { ...prev.styleSpec, ...patch } } : null))
  }, [])

  /** One-click fill recommended spec for the chosen document type (keep user edits to other fields where present). */
  const styleApplyRecommendedSpec = useCallback((docType: DocumentType | "") => {
    const recommended = recommendedSpecFor(docType)
    setStyleEditing((prev) => (prev ? { ...prev, styleSpec: { ...recommended } } : null))
  }, [])

  const styleUpdateRequirement = useCallback((index: number, value: string) => {
    setStyleEditing((prev) => {
      if (!prev) return null
      const next = [...prev.writingRequirements]
      next[index] = value
      return { ...prev, writingRequirements: next }
    })
  }, [])

  const styleAddRequirement = useCallback(() => {
    setStyleEditing((prev) => (prev ? { ...prev, writingRequirements: [...prev.writingRequirements, ""] } : null))
  }, [])

  const styleRemoveRequirement = useCallback((index: number) => {
    setStyleEditing((prev) => {
      if (!prev) return null
      return { ...prev, writingRequirements: prev.writingRequirements.filter((_, i) => i !== index) }
    })
  }, [])

  const styleMoveRequirement = useCallback((index: number, direction: "up" | "down") => {
    setStyleEditing((prev) => {
      if (!prev) return null
      const arr = [...prev.writingRequirements]
      const swap = direction === "up" ? index - 1 : index + 1
      if (swap < 0 || swap >= arr.length) return prev
      ;[arr[index], arr[swap]] = [arr[swap], arr[index]]
      return { ...prev, writingRequirements: arr }
    })
  }, [])

  const handleStyleSave = useCallback(() => {
    if (!styleEditing) return
    const now = new Date().toISOString()
    // drop empty requirement items on save
    const updated = { ...styleEditing, writingRequirements: styleEditing.writingRequirements.map((r) => r.trim()).filter(Boolean), updatedAt: now }
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
      // editing an existing template — revert to the saved snapshot, read-only
      setStyleEditing(styleSnapshot)
      setStyleReadOnly(true)
    } else {
      // canceling a brand-new (unsaved) template — go back to the list
      setStyleEditing(null)
      setStyleSnapshot(null)
      setStyleReadOnly(false)
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
            onAddSubsection={structAddSubsection}
            onPromoteSection={structPromoteSection}
            onDemoteSection={structDemoteSection}
            onRemoveSection={structRemoveSection}
            onMoveSection={structMoveSection}
            knowledgeFiles={state.files}
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
            onUpdateSpec={styleUpdateSpec}
            onApplyRecommendedSpec={styleApplyRecommendedSpec}
            onUpdateRequirement={styleUpdateRequirement}
            onAddRequirement={styleAddRequirement}
            onRemoveRequirement={styleRemoveRequirement}
            onMoveRequirement={styleMoveRequirement}
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
  onAddSubsection,
  onPromoteSection,
  onDemoteSection,
  onRemoveSection,
  onMoveSection,
  knowledgeFiles = [],
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
  onAddSubsection?: (parentId: string) => void
  onPromoteSection?: (id: string) => void
  onDemoteSection?: (id: string) => void
  onRemoveSection: (id: string) => void
  onMoveSection: (id: string, direction: "up" | "down") => void
  knowledgeFiles?: KnowledgeFile[]
  onSave: () => void
  onSaveAsNew: () => void
  onBack: () => void
  onSwitchToEdit?: () => void
  onCancelEdit?: () => void
  canSaveAsNew: boolean
}) {
  const canSave = !readOnly && template.name.trim().length > 0 && template.sections.length > 0 && template.sections.every((s) => s.title.trim().length > 0) && template.sections.every(validateSectionWordRange) && template.sections.every(validateSectionWritingContent)

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
        <label className="block text-xs font-[620] text-muted-text mb-1.5">
          模板名称<span className="text-accent-deep ml-0.5" aria-hidden>*</span>
        </label>
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
              "transition-[border-color,box-shadow] duration-150"
            )}
          />
        )}
      </div>

      {template.sections.length === 0 ? (
        <div className="py-6 text-center text-muted-text text-sm">{readOnly ? "该模板暂无章节" : "请添加至少一个章节"}</div>
      ) : (
        <div className="space-y-3 mb-4">
          {(() => {
            const groups = toGroups(template.sections)
            return groups.map((group, gi) => {
              const parent = group[0]
              const children = group.slice(1)
              return (
                <div key={parent.id} className="space-y-2">
                  <SectionCard
                    section={parent}
                    numberLabel={`${gi + 1}`}
                    canMoveUp={gi > 0}
                    canMoveDown={gi < groups.length - 1}
                    canDemote={gi < groups.length - 1}
                    readOnly={readOnly}
                    onUpdate={onUpdateSection}
                    onRemove={onRemoveSection}
                    onMove={onMoveSection}
                    onAddSubsection={onAddSubsection}
                    onDemoteSection={onDemoteSection}
                    knowledgeFiles={knowledgeFiles}
                  />
                  {children.map((child, ci) => (
                    <SectionCard
                      key={child.id}
                      section={child}
                      numberLabel={`${gi + 1}.${ci + 1}`}
                      canMoveUp={ci > 0}
                      canMoveDown={ci < children.length - 1}
                      readOnly={readOnly}
                      onUpdate={onUpdateSection}
                      onRemove={onRemoveSection}
                      onMove={onMoveSection}
                      onPromoteSection={onPromoteSection}
                      knowledgeFiles={knowledgeFiles}
                    />
                  ))}
                </div>
              )
            })
          })()}
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

const DOCUMENT_TYPE_OPTIONS: DocumentType[] = [
  "通知", "请示", "报告", "批复", "函", "纪要", "通报", "讲话", "简报", "调研报告", "工作总结", "其他",
]
const DIRECTION_OPTIONS: Direction[] = ["上行", "下行", "平行", "对内", "对外"]

function SpecField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-[620] text-muted-text mb-1">{label}</label>
      {children}
    </div>
  )
}

function SpecInputField({
  label, value, placeholder = "", readOnly, onChange,
}: {
  label: string
  value: string
  placeholder?: string
  readOnly?: boolean
  onChange: (v: string) => void
}) {
  return (
    <SpecField label={label}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={readOnly}
        className={cn(
          "w-full h-9 px-3 border border-line rounded-lg text-sm",
          "bg-white/60 text-foreground placeholder:text-subtle",
          "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
          "transition-[border-color,box-shadow] duration-150",
          readOnly && "bg-muted/30 cursor-not-allowed"
        )}
      />
    </SpecField>
  )
}

function RequirementItem({
  index, value, total, readOnly, onChange, onRemove, onMove,
}: {
  index: number
  value: string
  total: number
  readOnly?: boolean
  onChange: (v: string) => void
  onRemove: () => void
  onMove: (dir: "up" | "down") => void
}) {
  return (
    <div className="flex items-center gap-2 bg-white/60 border border-line rounded-xl p-2">
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={readOnly || index === 0}
          onClick={() => onMove("up")}
          className={cn(
            "w-6 h-6 rounded-md border border-line bg-white/60 hover:bg-white/80 grid place-items-center transition-[background,opacity] duration-150",
            readOnly || index === 0 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
          )}
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          disabled={readOnly || index === total - 1}
          onClick={() => onMove("down")}
          className={cn(
            "w-6 h-6 rounded-md border border-line bg-white/60 hover:bg-white/80 grid place-items-center transition-[background,opacity] duration-150",
            readOnly || index === total - 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
          )}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
      <span className="text-xs font-[680] text-muted-text w-5 text-center flex-none">{index + 1}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="如：善用排比句式增强气势"
        disabled={readOnly}
        className={cn(
          "flex-1 min-w-0 h-8 px-3 border border-line rounded-lg text-sm",
          "bg-white/60 text-foreground placeholder:text-subtle",
          "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
          "transition-[border-color,box-shadow] duration-150",
          readOnly && "bg-muted/30 cursor-not-allowed"
        )}
      />
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 rounded-lg grid place-items-center text-muted-text hover:text-accent-deep hover:bg-white/60 cursor-pointer transition-[color,background] duration-150 flex-none"
          title="删除此要求"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

function StyleEditPanel({
  template,
  readOnly = false,
  isPreset = false,
  onUpdateTemplate,
  onUpdateSpec,
  onApplyRecommendedSpec,
  onUpdateRequirement,
  onAddRequirement,
  onRemoveRequirement,
  onMoveRequirement,
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
  onUpdateSpec: (patch: Partial<StyleSpec>) => void
  onApplyRecommendedSpec: (docType: DocumentType | "") => void
  onUpdateRequirement: (index: number, value: string) => void
  onAddRequirement: () => void
  onRemoveRequirement: (index: number) => void
  onMoveRequirement: (index: number, direction: "up" | "down") => void
  onSave: () => void
  onSaveAsNew: () => void
  onBack: () => void
  onSwitchToEdit?: () => void
  onCancelEdit?: () => void
  canSaveAsNew: boolean
}) {
  const canSave = !readOnly && template.name.trim().length > 0
  const spec = template.styleSpec

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
        <label className="block text-xs font-[620] text-muted-text mb-1.5">
          模板名称<span className="text-accent-deep ml-0.5" aria-hidden>*</span>
        </label>
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
              "transition-[border-color,box-shadow] duration-150"
            )}
          />
        )}
      </div>

      {/* ---- 公文规格表 ---- */}
      <div className="mb-5">
        <label className="block text-xs font-[620] text-muted-text mb-2">公文规格</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 文种 — 选择后自动带出推荐规格 */}
          <SpecField label="文种">
            <select
              value={spec.documentType}
              onChange={(e) => onApplyRecommendedSpec(e.target.value as DocumentType | "")}
              disabled={readOnly}
              className={cn(
                "w-full h-9 px-3 border border-line rounded-lg text-sm bg-white/60 text-foreground",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] transition-[border-color] duration-150",
                readOnly && "bg-muted/30 cursor-not-allowed"
              )}
            >
              <option value="">请选择</option>
              {DOCUMENT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </SpecField>
          {/* 行文方向 */}
          <SpecField label="行文方向">
            <select
              value={spec.direction}
              onChange={(e) => onUpdateSpec({ direction: e.target.value as Direction | "" })}
              disabled={readOnly}
              className={cn(
                "w-full h-9 px-3 border border-line rounded-lg text-sm bg-white/60 text-foreground",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] transition-[border-color] duration-150",
                readOnly && "bg-muted/30 cursor-not-allowed"
              )}
            >
              <option value="">请选择</option>
              {DIRECTION_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </SpecField>
          <SpecInputField label="受众对象" value={spec.audience} readOnly={readOnly} onChange={(v) => onUpdateSpec({ audience: v })} />
          <SpecInputField label="语气" value={spec.tone} readOnly={readOnly} onChange={(v) => onUpdateSpec({ tone: v })} />
          <SpecInputField label="人称偏好" value={spec.person} readOnly={readOnly} onChange={(v) => onUpdateSpec({ person: v })} />
          <SpecInputField label="句式" value={spec.sentenceStyle} readOnly={readOnly} onChange={(v) => onUpdateSpec({ sentenceStyle: v })} />
          <SpecInputField label="用词" value={spec.diction} readOnly={readOnly} onChange={(v) => onUpdateSpec({ diction: v })} />
          <SpecInputField label="篇幅节奏" value={spec.lengthRhythm} readOnly={readOnly} onChange={(v) => onUpdateSpec({ lengthRhythm: v })} />
        </div>
      </div>

      {/* ---- 写作要求条目 ---- */}
      <div className="mb-5">
        <label className="block text-xs font-[620] text-muted-text mb-2">写作要求</label>
        {template.writingRequirements.length === 0 ? (
          readOnly ? <p className="text-sm text-muted-text">暂无写作要求</p> : null
        ) : (
          <div className="space-y-2 mb-2">
            {template.writingRequirements.map((req, idx) => (
              <RequirementItem
                key={idx}
                index={idx}
                value={req}
                total={template.writingRequirements.length}
                readOnly={readOnly}
                onChange={(v) => onUpdateRequirement(idx, v)}
                onRemove={() => onRemoveRequirement(idx)}
                onMove={(dir) => onMoveRequirement(idx, dir)}
              />
            ))}
          </div>
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={onAddRequirement}
            className="flex items-center gap-1.5 text-sm font-[620] text-accent-deep cursor-pointer hover:underline"
          >
            <Plus className="w-4 h-4" /> 添加写作要求
          </button>
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
