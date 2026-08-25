"use client"

import { useState, useCallback } from "react"
import { ArrowLeft, LayoutGrid, Palette, Pencil, Shield, FileStack } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch } from "@/hooks/use-app-state"
import {
  type WritingTemplate,
  type TemplateSection,
  loadSavedTemplates,
  saveTemplates,
} from "@/data/template"
import {
  type StyleTemplate,
  type StyleSpec,
  type DocumentType,
  recommendedSpecFor,
  loadSavedStyleTemplates,
  saveStyleTemplates,
} from "@/data/style"
import {
  updateSection, addSection, addSubsection,
  promoteSection, demoteSection, removeSection, moveSection,
} from "@/lib/template-section-ops"
import { StructureEditPanel, StyleEditPanel } from "@/components/template-library-view"

type AdminTab = "structure" | "style"

export function AdminShell() {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<AdminTab>("structure")

  const [structTemplates, setStructTemplates] = useState<WritingTemplate[]>(() => loadSavedTemplates())
  const [structEditing, setStructEditing] = useState<WritingTemplate | null>(null)

  const [styleTemplates, setStyleTemplates] = useState<StyleTemplate[]>(() => loadSavedStyleTemplates())
  const [styleEditing, setStyleEditing] = useState<StyleTemplate | null>(null)

  /* ── 结构模板编辑回调 ── */
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

  const handleStructSave = useCallback(() => {
    if (!structEditing) return
    const updated = { ...structEditing, updatedAt: new Date().toISOString() }
    const next = structTemplates.map((t) => (t.id === updated.id ? updated : t))
    setStructTemplates(next)
    saveTemplates(next)
    setStructEditing(updated)
  }, [structEditing, structTemplates])

  /* ── 风格模板编辑回调 ── */
  const handleStyleUpdateSpec = useCallback((patch: Partial<StyleSpec>) => {
    setStyleEditing((prev) => (prev ? { ...prev, styleSpec: { ...prev.styleSpec, ...patch } } : prev))
  }, [])

  const handleStyleApplyRecommended = useCallback((docType: DocumentType | "") => {
    const recommended = recommendedSpecFor(docType)
    setStyleEditing((prev) => (prev ? { ...prev, styleSpec: { ...recommended } } : prev))
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

  const handleStyleSave = useCallback(() => {
    if (!styleEditing) return
    const updated = {
      ...styleEditing,
      writingRequirements: styleEditing.writingRequirements.map((r) => r.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    }
    const next = styleTemplates.map((t) => (t.id === updated.id ? updated : t))
    setStyleTemplates(next)
    saveStyleTemplates(next)
    setStyleEditing(updated)
  }, [styleEditing, styleTemplates])

  const goBack = () => dispatch({ type: "SET_VIEW", view: "home" })

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
          {/* 后台主导航(目前只有模板管理) */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-accent-soft/60 text-accent-deep cursor-default">
            <FileStack className="w-4 h-4" />
            <span className="text-sm font-[620]">模板管理</span>
          </div>
          {/* 后台导航项占位:后续可加 用户管理 / 系统配置 等 */}
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
            <p className="mt-2 text-muted-text text-[13px] leading-relaxed">管理预设模板,修改即时生效(覆盖存于本地浏览器)</p>
          </div>

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
                isPreset={false}
                onUpdateTemplate={setStructEditing}
                onUpdateSection={handleStructUpdateSection}
                onAddSection={handleStructAddSection}
                onAddSubsection={handleStructAddSubsection}
                onPromoteSection={handleStructPromote}
                onDemoteSection={handleStructDemote}
                onRemoveSection={handleStructRemove}
                onMoveSection={handleStructMove}
                onSave={handleStructSave}
                onSaveAsNew={() => {}}
                onBack={() => setStructEditing(null)}
                canSaveAsNew={false}
              />
            ) : (
              <AdminTemplateList
                items={structTemplates.map((t) => ({ id: t.id, name: t.name, sub: `${t.sections.length} 个章节`, badge: t.id.startsWith("preset-") ? "预设" : "自定义" }))}
                onEdit={(id) => { const t = structTemplates.find((x) => x.id === id); if (t) setStructEditing({ ...t, sections: t.sections.map((s) => ({ ...s })) }) }}
              />
            )
          ) : (
            styleEditing ? (
              <StyleEditPanel
                template={styleEditing}
                readOnly={false}
                isPreset={false}
                onUpdateTemplate={setStyleEditing}
                onUpdateSpec={handleStyleUpdateSpec}
                onApplyRecommendedSpec={handleStyleApplyRecommended}
                onUpdateRequirement={handleStyleUpdateRequirement}
                onAddRequirement={handleStyleAddRequirement}
                onRemoveRequirement={handleStyleRemoveRequirement}
                onMoveRequirement={handleStyleMoveRequirement}
                onSave={handleStyleSave}
                onSaveAsNew={() => {}}
                onBack={() => setStyleEditing(null)}
                canSaveAsNew={false}
              />
            ) : (
              <AdminTemplateList
                items={styleTemplates.map((t) => ({ id: t.id, name: t.name, sub: `${t.writingRequirements.length} 段范文`, badge: t.id.startsWith("preset-") ? "预设" : "自定义" }))}
                onEdit={(id) => { const t = styleTemplates.find((x) => x.id === id); if (t) setStyleEditing({ ...t }) }}
              />
            )
          )}
        </div>
      </section>
    </div>
  )
}

/* ── 后台模板列表(预设/自定义卡片) ── */
function AdminTemplateList({
  items, onEdit,
}: {
  items: { id: string; name: string; sub: string; badge: string }[]
  onEdit: (id: string) => void
}) {
  if (items.length === 0) {
    return <div className="py-20 text-center text-sm text-muted-text">暂无模板</div>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((t) => (
        <div key={t.id} className="bg-white/80 border border-line rounded-2xl p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="text-sm font-[680] text-foreground truncate flex-1">{t.name}</h3>
            <span className={cn(
              "text-[10px] font-[660] px-1.5 py-0.5 rounded flex-none",
              t.badge === "预设" ? "bg-primary/10 text-primary" : "bg-accent-soft text-accent-deep"
            )}>{t.badge}</span>
          </div>
          <p className="text-xs text-muted-text mb-4">{t.sub}</p>
          <button
            type="button"
            onClick={() => onEdit(t.id)}
            className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-[620] border border-accent-deep/30 bg-accent-soft/50 text-accent-deep hover:bg-accent-soft cursor-pointer transition-[background] duration-150"
          >
            <Pencil className="w-3.5 h-3.5" /> 编辑
          </button>
        </div>
      ))}
    </div>
  )
}
