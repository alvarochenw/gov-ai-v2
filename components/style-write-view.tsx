"use client"

import { useState, useCallback } from "react"
import {
  Palette, ArrowRight, Upload, FileText, Check,
  Plus, Trash2, ChevronUp, ChevronDown, Lock, Unlock,
  Save, Copy, Loader2, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppState } from "@/hooks/use-app-state"
import { modeCopy } from "@/data/modes"
import {
  type StyleDimension,
  type StyleTemplate,
  presetStyleTemplates,
  mockExtractStyleFromFile,
  loadSavedStyleTemplates,
  saveStyleTemplates,
  createBlankStyleTemplate,
} from "@/data/style"
import { setStyleWritingInput } from "@/lib/style-data"
import type { ReferenceFile } from "@/lib/template-data"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { FileRow } from "@/components/file-row"

/* ------------------------------------------------------------------ */
/*  Types & constants                                                 */
/* ------------------------------------------------------------------ */

type SourceTab = "file" | "saved" | "custom"
type RefTab = "local" | "knowledge"
const MAX_TEMPLATES = 10

const uid = () => crypto.randomUUID()

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function StyleWriteView() {
  const dispatch = useAppDispatch()
  const state = useAppState()
  const copy = modeCopy["风格写作"]

  /* ---- state ---- */
  const [sourceTab, setSourceTab] = useState<SourceTab>("file")
  const [fileUploadTab, setFileUploadTab] = useState<"local" | "knowledge">("local")
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<StyleTemplate | null>(null)
  const [savedTemplates, setSavedTemplates] = useState<StyleTemplate[]>(() => loadSavedStyleTemplates())
  const [additionalNotes, setAdditionalNotes] = useState("")
  // reference documents
  const [refTab, setRefTab] = useState<RefTab>("local")
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([])
  const [localRefName, setLocalRefName] = useState<string | null>(null)
  const [selectedKnowledgeName, setSelectedKnowledgeName] = useState<string | null>(null)
  // delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<StyleTemplate | null>(null)

  /* ---- dimension helpers ---- */
  const updateDimension = useCallback((id: string, patch: Partial<StyleDimension>) => {
    setActiveTemplate((prev) =>
      prev
        ? { ...prev, dimensions: prev.dimensions.map((d) => (d.id === id ? { ...d, ...patch } : d)) }
        : null
    )
  }, [])

  const addDimension = useCallback(() => {
    setActiveTemplate((prev) => {
      if (!prev) return null
      const nextOrder = prev.dimensions.length
      return {
        ...prev,
        dimensions: [
          ...prev.dimensions,
          { id: uid(), name: "", value: "", fixedName: false, required: true, order: nextOrder },
        ],
      }
    })
  }, [])

  const removeDimension = useCallback((id: string) => {
    setActiveTemplate((prev) => {
      if (!prev) return null
      const filtered = prev.dimensions.filter((d) => d.id !== id)
      return { ...prev, dimensions: filtered.map((d, i) => ({ ...d, order: i })) }
    })
  }, [])

  const moveDimension = useCallback((id: string, direction: "up" | "down") => {
    setActiveTemplate((prev) => {
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

  /* ---- save / delete templates ---- */
  const persistTemplates = useCallback((next: StyleTemplate[]) => {
    setSavedTemplates(next)
    saveStyleTemplates(next)
  }, [])

  const handleSaveTemplate = useCallback(() => {
    if (!activeTemplate) return
    const now = new Date().toISOString()
    const updated = { ...activeTemplate, updatedAt: now }
    setActiveTemplate(updated)
    const exists = savedTemplates.some((t) => t.id === updated.id)
    if (exists) {
      persistTemplates(savedTemplates.map((t) => (t.id === updated.id ? updated : t)))
    } else {
      if (savedTemplates.length >= MAX_TEMPLATES) return
      persistTemplates([...savedTemplates, updated])
    }
  }, [activeTemplate, savedTemplates, persistTemplates])

  const handleSaveAsNew = useCallback(() => {
    if (!activeTemplate || savedTemplates.length >= MAX_TEMPLATES) return
    const now = new Date().toISOString()
    const newT: StyleTemplate = {
      ...activeTemplate,
      id: uid(),
      name: activeTemplate.name ? `${activeTemplate.name} (副本)` : "未命名模板",
      createdAt: now,
      updatedAt: now,
    }
    setActiveTemplate(newT)
    persistTemplates([...savedTemplates, newT])
  }, [activeTemplate, savedTemplates, persistTemplates])

  const handleDeleteTemplate = useCallback(() => {
    if (!deleteTarget) return
    const next = savedTemplates.filter((t) => t.id !== deleteTarget.id)
    persistTemplates(next)
    if (activeTemplate?.id === deleteTarget.id) setActiveTemplate(null)
    setDeleteTarget(null)
  }, [deleteTarget, savedTemplates, activeTemplate, persistTemplates])

  /* ---- file extraction ---- */
  const handleExtract = useCallback(async () => {
    if (!uploadedFileName) return
    setIsExtracting(true)
    try {
      const template = await mockExtractStyleFromFile(uploadedFileName)
      setActiveTemplate(template)
    } finally {
      setIsExtracting(false)
    }
  }, [uploadedFileName])

  /* ---- select saved template ---- */
  const handleSelectSaved = useCallback((t: StyleTemplate) => {
    setActiveTemplate({ ...t, dimensions: t.dimensions.map((d) => ({ ...d })) })
  }, [])

  /* ---- custom creation ---- */
  const handleStartCustom = useCallback(() => {
    setActiveTemplate(createBlankStyleTemplate())
  }, [])

  /* ---- reference files ---- */
  const addLocalRef = useCallback(() => {
    if (!localRefName) return
    setReferenceFiles((prev) => [...prev, { source: "local", name: localRefName }])
    setLocalRefName(null)
  }, [localRefName])

  const addKnowledgeRef = useCallback(() => {
    if (!selectedKnowledgeName) return
    if (referenceFiles.some((f) => f.name === selectedKnowledgeName)) return
    setReferenceFiles((prev) => [...prev, { source: "knowledge", name: selectedKnowledgeName }])
    setSelectedKnowledgeName(null)
  }, [selectedKnowledgeName, referenceFiles])

  const removeRef = useCallback((name: string) => {
    setReferenceFiles((prev) => prev.filter((f) => f.name !== name))
  }, [])

  /* ---- validation ---- */
  const canStart =
    activeTemplate !== null &&
    activeTemplate.name.trim().length > 0 &&
    activeTemplate.dimensions.length > 0 &&
    activeTemplate.dimensions.every((d) => d.name.trim().length > 0 && d.value.trim().length > 0)

  /* ---- start writing ---- */
  const handleStart = () => {
    if (!activeTemplate || !canStart) return
    setStyleWritingInput({
      templateName: activeTemplate.name,
      dimensions: activeTemplate.dimensions,
      styleNote: activeTemplate.styleNote,
      referenceFiles,
      additionalNotes,
    })
    dispatch({ type: "SET_CHAT_MODE", mode: "风格写作" })
    dispatch({ type: "CLEAR_CHAT" })
    dispatch({ type: "SET_VIEW", view: "chat" })
  }

  /* ---- derived ---- */
  const savedCount = savedTemplates.length
  const reachedMax = savedCount >= MAX_TEMPLATES
  const activeId = activeTemplate?.id ?? null

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  return (
    <div className="w-[min(960px,100%)] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-14 h-14 grid place-items-center rounded-2xl text-accent-deep bg-accent-soft">
          <Palette className="w-7 h-7" />
        </span>
        <div>
          <h1 className="text-2xl font-[760] tracking-[-0.03em]">{copy.title}</h1>
          <p className="mt-1 text-muted-text text-sm">{copy.subtitle}</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Card 1 — Source selection                                   */}
      {/* ============================================================ */}
      <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-[660] mb-3">一、选择风格模板来源</h3>

        <div className="flex gap-2 mb-5">
          {(["file", "saved", "custom"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setSourceTab(tab)
                if (tab === "custom" && !activeTemplate) handleStartCustom()
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
                sourceTab === tab
                  ? "bg-accent-soft text-accent-deep border-[rgba(200,60,78,0.24)]"
                  : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
              )}
            >
              {tab === "file" ? "从文件提取" : tab === "saved" ? "我的风格模板" : "自定义创建"}
            </button>
          ))}
        </div>

        {/* ---- File extraction ---- */}
        {sourceTab === "file" && (
          <div>
            {/* Upload sub-tabs */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setFileUploadTab("local")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
                  fileUploadTab === "local"
                    ? "bg-white text-foreground border-line"
                    : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
                )}
              >
                本地上传
              </button>
              <button
                type="button"
                onClick={() => setFileUploadTab("knowledge")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
                  fileUploadTab === "knowledge"
                    ? "bg-white text-foreground border-line"
                    : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
                )}
              >
                从知识库选择
              </button>
            </div>

            {fileUploadTab === "local" ? (
              /* Local upload drop zone */
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-3",
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer",
                  uploadedFileName
                    ? "border-success bg-[rgba(23,132,94,0.04)]"
                    : "border-line hover:border-[rgba(200,60,78,0.36)] hover:bg-accent-faint",
                  "transition-[border-color,background] duration-150"
                )}
              >
                {uploadedFileName ? (
                  <>
                    <FileText className="w-8 h-8 text-success" />
                    <span className="text-sm font-[620] text-foreground">{uploadedFileName}</span>
                    <span className="text-xs text-muted-text">点击重新选择</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-text" />
                    <span className="text-sm text-muted-text">
                      拖拽文件到此处，或<span className="text-accent-deep font-[620]">点击选择文件</span>
                    </span>
                    <span className="text-xs text-subtle">支持 .docx .pdf .txt 格式</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".docx,.pdf,.txt"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setUploadedFileName(file.name)
                  }}
                />
              </label>
            ) : (
              /* Knowledge base file list */
              <div className="border border-line rounded-xl overflow-hidden">
                {state.files.length === 0 ? (
                  <div className="p-6 text-center text-muted-text text-sm">知识库中暂无文件</div>
                ) : (
                  state.files.map((file) => (
                    <button
                      key={file.name}
                      type="button"
                      onClick={() =>
                        setUploadedFileName(uploadedFileName === file.name ? null : file.name)
                      }
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 border-0 bg-transparent cursor-pointer text-left",
                        "border-b border-line last:border-b-0",
                        "transition-[background] duration-100",
                        uploadedFileName === file.name ? "bg-accent-faint" : "hover:bg-white/60"
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex-none grid place-items-center",
                          "transition-[border-color,background] duration-150",
                          uploadedFileName === file.name
                            ? "border-accent-deep bg-accent-deep"
                            : "border-line bg-white"
                        )}
                      >
                        {uploadedFileName === file.name && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <FileRow file={file} />
                    </button>
                  ))
                )}
              </div>
            )}

            {uploadedFileName && (
              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting}
                className={cn(
                  "mt-4 w-full min-h-[40px] border rounded-xl px-4 py-2 cursor-pointer",
                  "text-white font-[620] text-sm",
                  "inline-flex items-center justify-center gap-2",
                  "transition-[background,opacity] duration-150",
                  isExtracting
                    ? "border-line bg-[#c9c3c7] opacity-60 cursor-not-allowed"
                    : "border-accent-deep bg-gradient-to-br from-[#cf4657] to-[#aa2639] hover:from-[#c23b4d] hover:to-[#981f32]"
                )}
              >
                {isExtracting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 正在提取...</>
                ) : (
                  <><FileText className="w-4 h-4" /> 提取风格</>
                )}
              </button>
            )}
          </div>
        )}

        {/* ---- Saved templates ---- */}
        {sourceTab === "saved" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-subtle">已保存 {savedCount}/{MAX_TEMPLATES}</span>
            </div>
            {savedTemplates.length === 0 ? (
              <div className="py-8 text-center text-muted-text text-sm">暂无保存的模板</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {savedTemplates.map((t) => {
                  const selected = activeId === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectSaved(t)}
                      className={cn(
                        "relative rounded-xl p-4 text-left border cursor-pointer",
                        "transition-[background,border-color] duration-150",
                        selected
                          ? "border-[rgba(200,60,78,0.36)] bg-accent-faint"
                          : "border-line bg-white/40 hover:bg-white/60"
                      )}
                    >
                      {selected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-deep grid place-items-center">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      )}
                      <p className="text-sm font-[660] mb-1 pr-6">{t.name}</p>
                      <p className="text-xs text-muted-text">
                        {t.dimensions.length} 个维度
                        <span className="ml-2 text-subtle">
                          {t.source === "file" ? "文件提取" : "自定义"}
                        </span>
                      </p>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(t) }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setDeleteTarget(t) } }}
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-lg grid place-items-center text-muted-text hover:text-accent-deep hover:bg-white/60 cursor-pointer transition-[color,background] duration-150"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ---- Custom creation ---- */}
        {sourceTab === "custom" && (
          <div>
            <label className="block text-xs font-[620] text-muted-text mb-1.5">模板名称</label>
            <input
              type="text"
              value={activeTemplate?.name ?? ""}
              onChange={(e) =>
                setActiveTemplate((prev) => prev ? { ...prev, name: e.target.value } : null)
              }
              placeholder="输入模板名称，如：领导讲话风格、机关通知体"
              className={cn(
                "w-full h-9 px-4 border border-line rounded-4xl text-sm",
                "bg-white/60 text-foreground placeholder:text-subtle",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                "transition-[border-color,box-shadow] duration-150"
              )}
            />
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Card 2 — Style dimensions editor                           */}
      {/* ============================================================ */}
      {activeTemplate && (
        <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-[660] mb-3">二、编辑风格维度</h3>

          {/* Template name (editable for non-custom tabs) */}
          {sourceTab !== "custom" && (
            <div className="mb-4">
              <label className="block text-xs font-[620] text-muted-text mb-1.5">模板名称</label>
              <input
                type="text"
                value={activeTemplate.name}
                onChange={(e) =>
                  setActiveTemplate((prev) => prev ? { ...prev, name: e.target.value } : null)
                }
                className={cn(
                  "w-full h-9 px-4 border border-line rounded-4xl text-sm",
                  "bg-white/60 text-foreground placeholder:text-subtle",
                  "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                  "transition-[border-color,box-shadow] duration-150"
                )}
              />
            </div>
          )}

          {/* Dimension list */}
          {activeTemplate.dimensions.length === 0 ? (
            <div className="py-6 text-center text-muted-text text-sm">请添加至少一个风格维度</div>
          ) : (
            <div className="space-y-3 mb-4">
              {activeTemplate.dimensions.map((dim, idx) => (
                <DimensionCard
                  key={dim.id}
                  dimension={dim}
                  index={idx}
                  total={activeTemplate.dimensions.length}
                  onUpdate={updateDimension}
                  onRemove={removeDimension}
                  onMove={moveDimension}
                />
              ))}
            </div>
          )}

          {/* Add dimension */}
          <button
            type="button"
            onClick={addDimension}
            className="flex items-center gap-1.5 text-sm font-[620] text-accent-deep cursor-pointer hover:underline mb-5"
          >
            <Plus className="w-4 h-4" /> 添加维度
          </button>

          {/* Style supplement note */}
          <div className="mb-5">
            <label className="block text-xs font-[620] text-muted-text mb-1.5">风格补充说明</label>
            <textarea
              value={activeTemplate.styleNote}
              onChange={(e) =>
                setActiveTemplate((prev) => prev ? { ...prev, styleNote: e.target.value } : null)
              }
              placeholder="描述整体风格特征、表达习惯等，如：善用排比句式增强气势，段落开头常以短句点题..."
              className={cn(
                "w-full min-h-[100px] border border-line rounded-xl p-4 text-sm leading-relaxed",
                "bg-white/60 text-foreground placeholder:text-subtle",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                "transition-[border-color,box-shadow] duration-150 resize-y"
              )}
            />
          </div>

          {/* Save actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveTemplate}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-[620] cursor-pointer",
                "border-line bg-white/60 hover:bg-white/80 transition-[background] duration-150"
              )}
            >
              <Save className="w-3.5 h-3.5" /> 保存模板
            </button>
            <button
              type="button"
              onClick={handleSaveAsNew}
              disabled={reachedMax}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-[620] cursor-pointer",
                "transition-[background,opacity] duration-150",
                reachedMax
                  ? "border-line text-muted-text opacity-50 cursor-not-allowed"
                  : "border-accent-deep bg-accent-soft text-accent-deep hover:bg-accent-faint"
              )}
            >
              <Copy className="w-3.5 h-3.5" /> 另存为新模板
            </button>
            {reachedMax && (
              <span className="text-xs text-accent-deep">已达到 {MAX_TEMPLATES} 个模板上限</span>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Card 3 — Reference documents                               */}
      {/* ============================================================ */}
      {activeTemplate && (
        <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-[660] mb-3">三、添加参考文档</h3>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setRefTab("local")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
                refTab === "local"
                  ? "bg-white text-foreground border-line"
                  : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
              )}
            >
              本地上传
            </button>
            <button
              type="button"
              onClick={() => setRefTab("knowledge")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
                refTab === "knowledge"
                  ? "bg-white text-foreground border-line"
                  : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
              )}
            >
              从知识库选择
            </button>
          </div>

          {/* Local upload */}
          {refTab === "local" && (
            <div>
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-3",
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer",
                  localRefName
                    ? "border-success bg-[rgba(23,132,94,0.04)]"
                    : "border-line hover:border-[rgba(200,60,78,0.36)] hover:bg-accent-faint",
                  "transition-[border-color,background] duration-150"
                )}
              >
                {localRefName ? (
                  <>
                    <FileText className="w-7 h-7 text-success" />
                    <span className="text-sm font-[620] text-foreground">{localRefName}</span>
                    <span className="text-xs text-muted-text">点击重新选择</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-muted-text" />
                    <span className="text-sm text-muted-text">
                      拖拽文件到此处，或<span className="text-accent-deep font-[620]">点击选择文件</span>
                    </span>
                    <span className="text-xs text-subtle">支持 .docx .pdf .txt 格式</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".docx,.pdf,.txt"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setLocalRefName(file.name)
                  }}
                />
              </label>
              {localRefName && (
                <button
                  type="button"
                  onClick={addLocalRef}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-white/60 text-sm font-[620] cursor-pointer hover:bg-white/80 transition-[background] duration-150"
                >
                  <Plus className="w-3.5 h-3.5" /> 添加此文件
                </button>
              )}
            </div>
          )}

          {/* Knowledge base */}
          {refTab === "knowledge" && (
            <div>
              {state.files.length === 0 ? (
                <div className="py-6 text-center text-muted-text text-sm">知识库中暂无文件</div>
              ) : (
                <div className="border border-line rounded-xl overflow-hidden">
                  {state.files.map((file) => {
                    const active = selectedKnowledgeName === file.name
                    const alreadyAdded = referenceFiles.some((f) => f.name === file.name)
                    return (
                      <button
                        key={file.name}
                        type="button"
                        onClick={() => setSelectedKnowledgeName(active ? null : file.name)}
                        disabled={alreadyAdded}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 border-0 bg-transparent cursor-pointer text-left",
                          "border-b border-line last:border-b-0",
                          "transition-[background] duration-100",
                          alreadyAdded ? "opacity-40 cursor-not-allowed" : active ? "bg-accent-faint" : "hover:bg-white/60"
                        )}
                      >
                        <span
                          className={cn(
                            "w-4 h-4 rounded-full border-2 flex-none grid place-items-center",
                            "transition-[border-color,background] duration-150",
                            active ? "border-accent-deep bg-accent-deep" : "border-line bg-white"
                          )}
                        >
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <FileRow file={file} />
                        {alreadyAdded && (
                          <span className="ml-auto text-xs text-muted-text flex-none">已添加</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              {selectedKnowledgeName && (
                <button
                  type="button"
                  onClick={addKnowledgeRef}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-white/60 text-sm font-[620] cursor-pointer hover:bg-white/80 transition-[background] duration-150"
                >
                  <Plus className="w-3.5 h-3.5" /> 添加此文件
                </button>
              )}
            </div>
          )}

          {/* Added reference files list */}
          {referenceFiles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-line">
              <p className="text-xs font-[620] text-muted-text mb-2">
                已添加 {referenceFiles.length} 个参考文档
              </p>
              <div className="space-y-2">
                {referenceFiles.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/60 border border-line"
                  >
                    <FileText className="w-4 h-4 text-muted-text flex-none" />
                    <span className="text-sm flex-1 min-w-0 truncate">{f.name}</span>
                    <span className="text-[10px] text-subtle flex-none">
                      {f.source === "local" ? "本地上传" : "知识库"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRef(f.name)}
                      className="w-5 h-5 rounded grid place-items-center text-muted-text hover:text-accent-deep hover:bg-white/60 cursor-pointer transition-[color,background] duration-150 flex-none"
                      title="移除"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  Card 4 — Writing requirements                              */}
      {/* ============================================================ */}
      {activeTemplate && (
        <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-[660] mb-3">四、写作要求</h3>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="补充说明：对全文的语气、风格、重点等要求..."
            className={cn(
              "w-full min-h-[100px] border border-line rounded-xl p-4 text-sm leading-relaxed",
              "bg-white/60 text-foreground placeholder:text-subtle",
              "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow] duration-150 resize-y"
            )}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/*  CTA button                                                  */}
      {/* ============================================================ */}
      <button
        type="button"
        onClick={handleStart}
        disabled={!canStart}
        className={cn(
          "w-full min-h-[48px] border rounded-2xl px-6 py-3 cursor-pointer",
          "text-white font-[660] text-base",
          "inline-flex items-center justify-center gap-2",
          "transition-[background,box-shadow,opacity] duration-150",
          canStart
            ? "border-accent-deep bg-gradient-to-br from-[#cf4657] to-[#aa2639] shadow-[0_10px_22px_rgba(170,38,57,0.18)] hover:from-[#c23b4d] hover:to-[#981f32]"
            : "border-line bg-[#c9c3c7] opacity-60 cursor-not-allowed"
        )}
      >
        开始风格写作
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="删除模板"
        description={`确定删除模板「${deleteTarget?.name}」吗？此操作不可撤销。`}
        variant="destructive"
        onConfirm={handleDeleteTemplate}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  DimensionCard sub-component                                       */
/* ------------------------------------------------------------------ */

function DimensionCard({
  dimension,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  dimension: StyleDimension
  index: number
  total: number
  onUpdate: (id: string, patch: Partial<StyleDimension>) => void
  onRemove: (id: string) => void
  onMove: (id: string, direction: "up" | "down") => void
}) {
  return (
    <div className="relative bg-white/60 border border-line rounded-xl p-4">
      {/* ---- Main row ---- */}
      <div className="flex items-center gap-2">
        {/* reorder */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(dimension.id, "up")}
            className={cn(
              "w-7 h-7 rounded-lg border border-line bg-white/60 hover:bg-white/80 grid place-items-center cursor-pointer",
              "transition-[background,opacity] duration-150",
              index === 0 && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(dimension.id, "down")}
            className={cn(
              "w-7 h-7 rounded-lg border border-line bg-white/60 hover:bg-white/80 grid place-items-center cursor-pointer",
              "transition-[background,opacity] duration-150",
              index === total - 1 && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* index */}
        <span className="text-sm font-[680] text-muted-text w-5 text-center flex-none">{index + 1}</span>

        {/* dimension name input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <label className="text-xs font-[620] text-muted-text flex-none">维度</label>
          <input
            type="text"
            value={dimension.name}
            onChange={(e) => onUpdate(dimension.id, { name: e.target.value })}
            placeholder="如：语气风格"
            disabled={dimension.fixedName}
            className={cn(
              "flex-1 min-w-0 h-8 px-3 border rounded-lg text-sm",
              "bg-white/60 text-foreground placeholder:text-subtle",
              "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow] duration-150",
              dimension.fixedName && "bg-muted/30 cursor-not-allowed",
              !dimension.fixedName && dimension.name.trim().length === 0 && "border-destructive"
            )}
          />
          {/* lock/unlock */}
          <button
            type="button"
            onClick={() => onUpdate(dimension.id, { fixedName: !dimension.fixedName })}
            className={cn(
              "w-7 h-7 rounded-lg hover:bg-white/60 grid place-items-center cursor-pointer",
              "transition-[background] duration-150",
              dimension.fixedName ? "text-accent-deep" : "text-muted-text"
            )}
            title={dimension.fixedName ? "点击解锁维度名" : "点击锁定维度名"}
          >
            {dimension.fixedName ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* dimension value input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <label className="text-xs font-[620] text-muted-text flex-none">值</label>
          <input
            type="text"
            value={dimension.value}
            onChange={(e) => onUpdate(dimension.id, { value: e.target.value })}
            placeholder="如：严肃正式"
            className={cn(
              "flex-1 min-w-0 h-8 px-3 border rounded-lg text-sm",
              "bg-white/60 text-foreground placeholder:text-subtle",
              "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow] duration-150",
              dimension.value.trim().length === 0 && "border-destructive"
            )}
          />
        </div>

        {/* required / optional toggle */}
        <div className="flex gap-0.5 flex-none">
          <button
            type="button"
            onClick={() => onUpdate(dimension.id, { required: true })}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-[620] cursor-pointer transition-[background,color] duration-150",
              dimension.required
                ? "bg-accent-soft text-accent-deep"
                : "bg-transparent text-muted-text hover:bg-white/60"
            )}
          >
            必填
          </button>
          <button
            type="button"
            onClick={() => onUpdate(dimension.id, { required: false })}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-[620] cursor-pointer transition-[background,color] duration-150",
              !dimension.required
                ? "bg-accent-soft text-accent-deep"
                : "bg-transparent text-muted-text hover:bg-white/60"
            )}
          >
            可选
          </button>
        </div>
      </div>

      {/* ---- Delete button ---- */}
      <button
        type="button"
        onClick={() => onRemove(dimension.id)}
        className="absolute top-3 right-3 w-6 h-6 rounded-lg grid place-items-center text-muted-text hover:text-accent-deep hover:bg-white/60 cursor-pointer transition-[color,background] duration-150"
        title="删除维度"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
