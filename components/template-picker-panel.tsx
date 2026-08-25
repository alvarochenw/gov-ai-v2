"use client"

import { useState, useCallback, useEffect, useMemo, Fragment } from "react"
import { LayoutGrid, Pencil, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type WritingTemplate,
  type TemplateSection,
  loadSavedTemplates,
  saveTemplates,
  MAX_TEMPLATES,
} from "@/data/template"
import { TemplatePickerDialog } from "@/components/template-picker-dialog"
import { SectionAdjuster } from "@/components/section-adjuster"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface TemplatePickerPanelProps {
  /** 选定/微调后,把模板与最终章节同步给父组件(用于「下一步」启用与后续生成)。 */
  onConfirm: (template: WritingTemplate, sections: TemplateSection[]) => void
}

export function TemplatePickerPanel({ onConfirm }: TemplatePickerPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WritingTemplate | null>(null)
  const [adjustedSections, setAdjustedSections] = useState<TemplateSection[] | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [adjusterOpen, setAdjusterOpen] = useState(false)

  // 另存为自定义模板
  const [saveAsNewOpen, setSaveAsNewOpen] = useState(false)
  const [saveAsNewName, setSaveAsNewName] = useState("")
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null)

  const adjusted = !!adjustedSections
  const effectiveSections: TemplateSection[] = useMemo(
    () => adjustedSections ?? selectedTemplate?.sections ?? [],
    [adjustedSections, selectedTemplate]
  )

  // 同步给父组件
  useEffect(() => {
    if (selectedTemplate) {
      onConfirm(selectedTemplate, effectiveSections)
    }
  }, [selectedTemplate, effectiveSections, onConfirm])

  const handlePick = useCallback((t: WritingTemplate) => {
    setSelectedTemplate(t)
    setAdjustedSections(null)
    setNotice(null)
  }, [])

  const handleAdjust = useCallback(() => {
    if (!selectedTemplate) return
    setAdjustedSections(effectiveSections.map((s) => ({ ...s })))
    setAdjusterOpen(true)
  }, [selectedTemplate, effectiveSections])

  const handleRemove = useCallback(() => {
    setSelectedTemplate(null)
    setAdjustedSections(null)
    setNotice(null)
  }, [])

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
      createdAt: now, updatedAt: now,
    }
    saveTemplates([...all, newT])
    setSaveAsNewOpen(false)
    setSaveAsNewName("")
    setNotice({ text: `已保存为自定义模板:${name}(可在模板库查看)`, ok: true })
  }, [selectedTemplate, saveAsNewName, effectiveSections])

  return (
    <div>
      {!selectedTemplate ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className={cn(
            "w-full min-h-[120px] rounded-2xl border border-dashed border-line",
            "flex flex-col items-center justify-center gap-2 cursor-pointer",
            "text-muted-text hover:border-[rgba(200,60,78,0.30)] hover:text-accent-deep hover:bg-white/60",
            "transition-[border-color,color,background] duration-150"
          )}
        >
          <LayoutGrid className="w-7 h-7" />
          <span className="text-sm font-[620]">选取模板</span>
          <span className="text-[11px] text-subtle">从模板库选择结构模板,可后续微调</span>
        </button>
      ) : (
        <div className="space-y-3">
          {notice && (
            <div className={cn(
              "rounded-xl px-3 py-2 text-xs",
              notice.ok ? "bg-emerald-50 text-emerald-700" : "bg-accent-faint text-accent-deep"
            )}>
              {notice.text}
            </div>
          )}
          <SelectedTemplateSummary
            template={selectedTemplate}
            sections={effectiveSections}
            adjusted={adjusted}
            onReplace={() => setPickerOpen(true)}
            onRemove={handleRemove}
            onAdjust={handleAdjust}
            onSaveAsNew={openSaveAsNew}
          />
        </div>
      )}

      <TemplatePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={handlePick}
      />

      {adjusterOpen && selectedTemplate && (
        <SectionAdjuster
          templateName={selectedTemplate.name}
          sections={adjustedSections ?? selectedTemplate.sections}
          onChange={setAdjustedSections}
          onClose={() => setAdjusterOpen(false)}
        />
      )}

      {/* 另存为命名对话框 */}
      <Dialog open={saveAsNewOpen} onOpenChange={setSaveAsNewOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-2 space-y-3">
            <DialogHeader>
              <DialogTitle className="text-left text-base font-semibold tracking-tight">另存为自定义模板</DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                将本次微调后的结构保存为新模板,原模板不变。请输入名称:
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
            <DialogClose render={(props: React.ComponentProps<"button">) => <Button variant="outline" size="default" {...props} />}>取消</DialogClose>
            <Button size="default" onClick={handleSaveAsNew} disabled={!saveAsNewName.trim()}>确认保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── 模板摘要(只读章节列表 + 操作按钮),抽取自 template-write-view ── */
function SelectedTemplateSummary({
  template, sections, adjusted, onReplace, onRemove, onAdjust, onSaveAsNew,
}: {
  template: WritingTemplate
  sections: TemplateSection[]
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
      <div className="flex items-start gap-3 mb-3">
        <span className="w-9 h-9 rounded-xl bg-accent-faint text-accent-deep grid place-items-center flex-none">
          <LayoutGrid className="w-4.5 h-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-[680] text-foreground truncate">{template.name}</h4>
            <span className={cn(
              "text-[9px] font-[660] px-1.5 py-0.5 rounded flex-none",
              isPreset ? "bg-primary/10 text-primary" : "bg-accent-soft text-accent-deep"
            )}>
              {isPreset ? "预设" : template.source === "file" ? "文件提取" : "自定义"}
            </span>
            {adjusted && (
              <span className="text-[9px] font-[660] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 flex-none">已微调</span>
            )}
          </div>
          <p className="text-xs text-muted-text mt-0.5">{groups.length} 个一级标题 · 共 {sections.length} 个章节</p>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-line pt-3">
        {groups.map((group, gi) => (
          <div key={group[0].id}>
            {group.map((s, si) => {
              const isSub = s.level === 2
              const label = isSub ? `${gi + 1}.${si}` : `${gi + 1}`
              const wordRange =
                s.wordCountMin != null && s.wordCountMax != null ? `${s.wordCountMin}-${s.wordCountMax}字`
                  : s.wordCountMin != null ? `≥${s.wordCountMin}字`
                    : s.wordCountMax != null ? `≤${s.wordCountMax}字` : ""
              return (
                <Fragment key={s.id}>
                  <div className={cn("flex items-center gap-2 py-1", isSub && "ml-6")}>
                    <span className={cn("text-[11px] font-[680] text-muted-text w-6 text-center flex-none", isSub && "text-[10px]")}>{label}</span>
                    <span className={cn("text-xs flex-1 min-w-0 truncate", isSub ? "text-muted-text font-[560]" : "text-foreground font-[600]")}>
                      {s.title || "（无标题）"}
                    </span>
                    {wordRange && <span className="text-[10px] text-subtle flex-none">{wordRange}</span>}
                    {s.writingMode === "fill" && <span className="text-[10px] text-accent-deep/70 flex-none">占位符</span>}
                  </div>
                </Fragment>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line flex-wrap">
        <button type="button" onClick={onReplace} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white/60 text-xs font-[620] cursor-pointer hover:bg-white/80 transition-[background] duration-150">
          <LayoutGrid className="w-3.5 h-3.5" /> 更换模板
        </button>
        <button type="button" onClick={onAdjust} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white/60 text-xs font-[620] text-foreground cursor-pointer hover:bg-white/80 transition-[background] duration-150">
          <Pencil className="w-3.5 h-3.5" /> {adjusted ? "继续微调" : "本次微调"}
        </button>
        {adjusted && (
          <button type="button" onClick={onSaveAsNew} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent-deep/30 bg-accent-soft/50 text-xs font-[620] text-accent-deep cursor-pointer hover:bg-accent-soft transition-[background] duration-150" title="将本次微调后的结构保存为新的自定义模板,原预设不变">
            <Save className="w-3.5 h-3.5" /> 另存为自定义模板
          </button>
        )}
        <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-[620] text-muted-text hover:text-accent-deep cursor-pointer border-0 bg-transparent transition-colors duration-150">
          <X className="w-3.5 h-3.5" /> 移除
        </button>
      </div>
    </div>
  )
}

function toGroups(sections: TemplateSection[]): TemplateSection[][] {
  const groups: TemplateSection[][] = []
  let current: TemplateSection[] = []
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
