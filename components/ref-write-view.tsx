"use client"

import { useState, useCallback } from "react"
import {
  Copy, ArrowRight, Upload, FileText,
  Loader2, List, Quote, X, Plus,
  PenLine, RefreshCw, Pen, BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppState } from "@/hooks/use-app-state"
import { modeCopy } from "@/data/modes"
import {
  type RefMaterial,
  type RefOverview,
  type WritingMode,
  writingModeOptions,
  mockExtractRefOverview,
} from "@/data/ref"
import { setRefWritingInput } from "@/lib/ref-data"
import type { ReferenceFile } from "@/lib/template-data"
import { FileRow } from "@/components/file-row"

/* ------------------------------------------------------------------ */
/*  Types & constants                                                 */
/* ------------------------------------------------------------------ */

type InputTab = "upload" | "paste"
type UploadTab = "local" | "knowledge"

const uid = () => crypto.randomUUID()

const modeIcons: Record<WritingMode, typeof PenLine> = {
  "仿写": PenLine,
  "改写": RefreshCw,
  "续写": Pen,
  "扩写": BookOpen,
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function RefWriteView() {
  const dispatch = useAppDispatch()
  const state = useAppState()
  const copy = modeCopy["以文写文"]

  /* ---- state ---- */
  const [inputTab, setInputTab] = useState<InputTab>("upload")
  const [uploadTab, setUploadTab] = useState<UploadTab>("local")
  // pending selections (before adding to list)
  const [localFileName, setLocalFileName] = useState<string | null>(null)
  const [selectedKnowledgeName, setSelectedKnowledgeName] = useState<string | null>(null)
  const [pastedText, setPastedText] = useState("")
  // added materials
  const [materials, setMaterials] = useState<RefMaterial[]>([])
  // extraction
  const [isExtracting, setIsExtracting] = useState(false)
  const [refOverview, setRefOverview] = useState<RefOverview | null>(null)
  // writing mode
  const [writingMode, setWritingMode] = useState<WritingMode | null>(null)
  // writing requirements
  const [direction, setDirection] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  // reference documents
  const [refTab, setRefTab] = useState<"local" | "knowledge">("local")
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([])
  const [localRefName, setLocalRefName] = useState<string | null>(null)
  const [selectedRefKnowledgeName, setSelectedRefKnowledgeName] = useState<string | null>(null)

  /* ---- material helpers ---- */
  const addLocalMaterial = useCallback(() => {
    if (!localFileName) return
    setMaterials((prev) => [...prev, { id: uid(), source: "local", name: localFileName }])
    setLocalFileName(null)
  }, [localFileName])

  const addKnowledgeMaterial = useCallback(() => {
    if (!selectedKnowledgeName) return
    if (materials.some((m) => m.name === selectedKnowledgeName && m.source === "knowledge")) return
    setMaterials((prev) => [...prev, { id: uid(), source: "knowledge", name: selectedKnowledgeName }])
    setSelectedKnowledgeName(null)
  }, [selectedKnowledgeName, materials])

  const addPasteMaterial = useCallback(() => {
    if (!pastedText.trim()) return
    const charCount = pastedText.trim().length
    setMaterials((prev) => [
      ...prev,
      { id: uid(), source: "paste", name: `粘贴文本(${charCount}字)`, pasteContent: pastedText.trim() },
    ])
    setPastedText("")
  }, [pastedText])

  const removeMaterial = useCallback((id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }, [])

  /* ---- extraction ---- */
  const handleExtract = useCallback(async () => {
    if (materials.length === 0) return
    setIsExtracting(true)
    try {
      const overview = await mockExtractRefOverview(materials)
      setRefOverview(overview)
    } finally {
      setIsExtracting(false)
    }
  }, [materials])

  /* ---- reference files ---- */
  const addLocalRef = useCallback(() => {
    if (!localRefName) return
    setReferenceFiles((prev) => [...prev, { source: "local", name: localRefName }])
    setLocalRefName(null)
  }, [localRefName])

  const addKnowledgeRef = useCallback(() => {
    if (!selectedRefKnowledgeName) return
    if (referenceFiles.some((f) => f.name === selectedRefKnowledgeName)) return
    setReferenceFiles((prev) => [...prev, { source: "knowledge", name: selectedRefKnowledgeName }])
    setSelectedRefKnowledgeName(null)
  }, [selectedRefKnowledgeName, referenceFiles])

  const removeRef = useCallback((name: string) => {
    setReferenceFiles((prev) => prev.filter((f) => f.name !== name))
  }, [])

  /* ---- validation ---- */
  const canStart = materials.length > 0 && writingMode !== null

  /* ---- start writing ---- */
  const handleStart = () => {
    if (!canStart || !writingMode) return
    setRefWritingInput({
      materials,
      refOverview,
      writingMode,
      referenceFiles,
      direction,
      additionalNotes,
    })
    dispatch({ type: "SET_CHAT_MODE", mode: "以文写文" })
    dispatch({ type: "CLEAR_CHAT" })
    dispatch({ type: "SET_VIEW", view: "chat" })
  }

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  return (
    <div className="w-[min(960px,100%)] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-14 h-14 grid place-items-center rounded-2xl text-accent-deep bg-accent-soft">
          <Copy className="w-7 h-7" />
        </span>
        <div>
          <h1 className="text-2xl font-[760] tracking-[-0.03em]">{copy.title}</h1>
          <p className="mt-1 text-muted-text text-sm">{copy.subtitle}</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Card 1 — Add reference materials                           */}
      {/* ============================================================ */}
      <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-[660] mb-3">一、添加参考材料</h3>

        {/* Input mode toggle */}
        <div className="flex gap-2 mb-5">
          {(["upload", "paste"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setInputTab(tab)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
                inputTab === tab
                  ? "bg-accent-soft text-accent-deep border-[rgba(200,60,78,0.24)]"
                  : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
              )}
            >
              {tab === "upload" ? "上传文件" : "粘贴原文"}
            </button>
          ))}
        </div>

        {/* ---- Upload section ---- */}
        {inputTab === "upload" && (
          <div className="mb-5">
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setUploadTab("local")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
                  uploadTab === "local"
                    ? "bg-white text-foreground border-line"
                    : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
                )}
              >
                本地上传
              </button>
              <button
                type="button"
                onClick={() => setUploadTab("knowledge")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
                  uploadTab === "knowledge"
                    ? "bg-white text-foreground border-line"
                    : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
                )}
              >
                从知识库选择
              </button>
            </div>

            {uploadTab === "local" ? (
              <div>
                <label
                  className={cn(
                    "flex flex-col items-center justify-center gap-3",
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer",
                    localFileName
                      ? "border-success bg-[rgba(23,132,94,0.04)]"
                      : "border-line hover:border-[rgba(200,60,78,0.36)] hover:bg-accent-faint",
                    "transition-[border-color,background] duration-150"
                  )}
                >
                  {localFileName ? (
                    <>
                      <FileText className="w-7 h-7 text-success" />
                      <span className="text-sm font-[620] text-foreground">{localFileName}</span>
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
                      if (file) setLocalFileName(file.name)
                    }}
                  />
                </label>
                {localFileName && (
                  <button
                    type="button"
                    onClick={addLocalMaterial}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-white/60 text-sm font-[620] cursor-pointer hover:bg-white/80 transition-[background] duration-150"
                  >
                    <Plus className="w-3.5 h-3.5" /> 添加此文件
                  </button>
                )}
              </div>
            ) : (
              <div>
                {state.files.length === 0 ? (
                  <div className="py-6 text-center text-muted-text text-sm">知识库中暂无文件</div>
                ) : (
                  <div className="border border-line rounded-xl overflow-hidden">
                    {state.files.map((file) => {
                      const active = selectedKnowledgeName === file.name
                      const alreadyAdded = materials.some((m) => m.name === file.name && m.source === "knowledge")
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
                    onClick={addKnowledgeMaterial}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-white/60 text-sm font-[620] cursor-pointer hover:bg-white/80 transition-[background] duration-150"
                  >
                    <Plus className="w-3.5 h-3.5" /> 添加此文件
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---- Paste text section ---- */}
        {inputTab === "paste" && (
          <div className="mb-5">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="请粘贴参考材料的原文内容..."
              className={cn(
                "w-full min-h-[150px] border border-line rounded-xl p-4 text-sm leading-relaxed",
                "bg-white/60 text-foreground placeholder:text-subtle",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                "transition-[border-color,box-shadow] duration-150 resize-y"
              )}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-subtle">已输入 {pastedText.length} 字</p>
              {pastedText.trim() && (
                <button
                  type="button"
                  onClick={addPasteMaterial}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-white/60 text-sm font-[620] cursor-pointer hover:bg-white/80 transition-[background] duration-150"
                >
                  <Plus className="w-3.5 h-3.5" /> 添加
                </button>
              )}
            </div>
          </div>
        )}

        {/* ---- Added materials list ---- */}
        {materials.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-[620] text-muted-text mb-2">
              已添加 {materials.length} 个参考材料
            </p>
            <div className="space-y-2">
              {materials.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/60 border border-line"
                >
                  <FileText className="w-4 h-4 text-muted-text flex-none" />
                  <span className="text-sm flex-1 min-w-0 truncate">{m.name}</span>
                  <span className="text-[10px] text-subtle flex-none">
                    {m.source === "local" ? "本地上传" : m.source === "knowledge" ? "知识库" : "粘贴原文"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMaterial(m.id)}
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

        {/* Extract overview button */}
        {materials.length > 0 && (
          <button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting}
            className={cn(
              "w-full min-h-[40px] border rounded-xl px-4 py-2 cursor-pointer",
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
              <><FileText className="w-4 h-4" /> 提取参考概览</>
            )}
          </button>
        )}

        {/* ---- Read-only overview ---- */}
        {refOverview && (
          <div className="mt-5 bg-white/60 border border-line rounded-xl p-5">
            <h4 className="text-sm font-[660] mb-3">参考概览</h4>
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <List className="w-4 h-4 text-accent-deep" />
                <span className="text-xs font-[620] text-muted-text">结构大纲</span>
              </div>
              <ul className="space-y-1 ml-5.5">
                {refOverview.structureItems.map((item, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-accent-deep mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Quote className="w-4 h-4 text-accent-deep" />
                <span className="text-xs font-[620] text-muted-text">关键表达</span>
              </div>
              <div className="flex flex-wrap gap-2 ml-5.5">
                {refOverview.keyExpressions.map((expr, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-accent-soft text-accent-deep text-xs font-[620]"
                  >
                    &ldquo;{expr}&rdquo;
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Card 2 — Writing mode selection                            */}
      {/* ============================================================ */}
      <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-[660] mb-3">二、选择写作模式</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {writingModeOptions.map((opt) => {
            const Icon = modeIcons[opt.mode]
            const selected = writingMode === opt.mode
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setWritingMode(selected ? null : opt.mode)}
                className={cn(
                  "relative rounded-xl p-4 text-center border cursor-pointer",
                  "transition-[background,border-color] duration-150",
                  selected
                    ? "border-[rgba(200,60,78,0.36)] bg-accent-faint"
                    : "border-line bg-white/40 hover:bg-white/60"
                )}
              >
                {selected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-deep grid place-items-center">
                    <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <Icon className={cn("w-6 h-6 mx-auto mb-2", selected ? "text-accent-deep" : "text-muted-text")} />
                <p className="text-sm font-[660]">{opt.mode}</p>
                <p className="text-[11px] text-muted-text mt-1">{opt.label}</p>
              </button>
            )
          })}
        </div>

        {writingMode && (
          <p className="mt-3 text-xs text-muted-text">
            {writingModeOptions.find((o) => o.mode === writingMode)?.description}
          </p>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Card 3 — Writing requirements                              */}
      {/* ============================================================ */}
      <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-[660] mb-3">三、写作要求</h3>

        <div className="mb-4">
          <label className="block text-xs font-[620] text-muted-text mb-1.5">调整方向</label>
          <input
            type="text"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder={
              writingMode === "仿写" ? "如：仿写一份同类主题的通知、撰写风格一致的简报..."
              : writingMode === "改写" ? "如：改写为通知格式、调整为更正式的语气、转成会议纪要..."
              : writingMode === "续写" ? "如：续写下阶段工作计划、补充后续落实措施..."
              : writingMode === "扩写" ? "如：展开第三部分的论述细节、充实数据论证..."
              : "如：仿写同类公文、改写为通知格式、续写下一阶段计划..."
            }
            className={cn(
              "w-full h-9 px-4 border border-line rounded-4xl text-sm",
              "bg-white/60 text-foreground placeholder:text-subtle",
              "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
              "transition-[border-color,box-shadow] duration-150"
            )}
          />
        </div>

        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder={
            writingMode === "仿写" ? "补充说明：新文稿的主题、重点内容、与原文的差异之处..."
            : writingMode === "改写" ? "补充说明：目标文种格式要求、语气调整方向、需要保留或删改的内容..."
            : writingMode === "续写" ? "补充说明：续写的起始位置、需要补充的内容方向、与原文的衔接要求..."
            : writingMode === "扩写" ? "补充说明：需要展开的章节、补充的论据类型、详略分配..."
            : "补充说明：对全文的语气、风格、重点等要求..."
          }
          className={cn(
            "w-full min-h-[100px] border border-line rounded-xl p-4 text-sm leading-relaxed",
            "bg-white/60 text-foreground placeholder:text-subtle",
            "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
            "transition-[border-color,box-shadow] duration-150 resize-y"
          )}
        />
      </div>

      {/* ============================================================ */}
      {/*  Card 4 — Reference documents                               */}
      {/* ============================================================ */}
      <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-[660] mb-3">四、添加参考文档</h3>

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
                  const active = selectedRefKnowledgeName === file.name
                  const alreadyAdded = referenceFiles.some((f) => f.name === file.name)
                  return (
                    <button
                      key={file.name}
                      type="button"
                      onClick={() => setSelectedRefKnowledgeName(active ? null : file.name)}
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
            {selectedRefKnowledgeName && (
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
        开始以文写文
        <ArrowRight className="w-5 h-5" />
      </button>

    </div>
  )
}
