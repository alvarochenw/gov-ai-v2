"use client"

import { useState } from "react"
import { Check, ArrowRight, Upload, FileText, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppState, useAppDispatch } from "@/hooks/use-app-state"
import { FileRow } from "@/components/file-row"
import { proofreadEngines, proofreadDictionaries } from "@/data/proofread"
import { setProofreadInput } from "@/lib/proofread-data"

type InputTab = "upload" | "paste"
type UploadTab = "local" | "knowledge"

export function ProofreadConfigView() {
  const dispatch = useAppDispatch()
  const state = useAppState()

  const [inputTab, setInputTab] = useState<InputTab>("upload")
  const [uploadTab, setUploadTab] = useState<UploadTab>("local")
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [pastedText, setPastedText] = useState("")
  const [selectedEngine, setSelectedEngine] = useState<string | null>("heima")
  const [selectedDicts, setSelectedDicts] = useState<Set<string>>(
    () => new Set(proofreadDictionaries.map((d) => d.id))
  )

  const toggleDict = (id: string) => {
    setSelectedDicts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleStart = () => {
    const sourceType = inputTab === "paste" ? "paste" : uploadTab === "local" ? "file" : "knowledge"
    setProofreadInput({
      sourceType,
      fileName: sourceType !== "paste" ? selectedFileName ?? undefined : undefined,
      text: sourceType === "paste" ? pastedText : "",
      selectedDictionaries: Array.from(selectedDicts),
    })
    dispatch({ type: "SET_VIEW", view: "proofread-editor" })
  }

  const hasInput =
    (inputTab === "paste" && pastedText.trim().length > 0) ||
    (inputTab === "upload" && uploadTab === "knowledge" && selectedFileName !== null) ||
    (inputTab === "upload" && uploadTab === "local" && selectedFileName !== null)

  const hasRule = selectedEngine !== null || selectedDicts.size > 0

  const canStart = hasInput && hasRule

  return (
    <div className="w-[min(960px,100%)] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-14 h-14 grid place-items-center rounded-2xl text-accent-deep bg-accent-soft">
          <Check className="w-7 h-7" />
        </span>
        <div>
          <h1 className="text-2xl font-[760] tracking-[-0.03em]">智能校对</h1>
          <p className="mt-1 text-muted-text text-sm">
            上传公文或粘贴文本，选择校对规则，一键生成校对结果
          </p>
        </div>
      </div>

      {/* Config card */}
      <div className="bg-white/80 border border-line rounded-2xl p-6 mb-6">
        {/* Input mode toggle */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setInputTab("upload")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
              inputTab === "upload"
                ? "bg-accent-soft text-accent-deep border-[rgba(200,60,78,0.24)]"
                : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
            )}
          >
            上传文件
          </button>
          <button
            type="button"
            onClick={() => setInputTab("paste")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
              inputTab === "paste"
                ? "bg-accent-soft text-accent-deep border-[rgba(200,60,78,0.24)]"
                : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
            )}
          >
            粘贴文本
          </button>
        </div>

        {/* Upload section */}
        {inputTab === "upload" && (
          <div className="mb-5">
            {/* Upload sub-tabs */}
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
              /* Local upload drop zone */
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-3",
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer",
                  selectedFileName
                    ? "border-success bg-[rgba(23,132,94,0.04)]"
                    : "border-line hover:border-[rgba(200,60,78,0.36)] hover:bg-accent-faint",
                  "transition-[border-color,background] duration-150"
                )}
              >
                {selectedFileName ? (
                  <>
                    <FileText className="w-8 h-8 text-success" />
                    <span className="text-sm font-[620] text-foreground">{selectedFileName}</span>
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
                    if (file) setSelectedFileName(file.name)
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
                        setSelectedFileName(selectedFileName === file.name ? null : file.name)
                      }
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 border-0 bg-transparent cursor-pointer text-left",
                        "border-b border-line last:border-b-0",
                        "transition-[background] duration-100",
                        selectedFileName === file.name ? "bg-accent-faint" : "hover:bg-white/60"
                      )}
                    >
                      {/* Radio indicator */}
                      <span
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex-none grid place-items-center",
                          "transition-[border-color,background] duration-150",
                          selectedFileName === file.name
                            ? "border-accent-deep bg-accent-deep"
                            : "border-line bg-white"
                        )}
                      >
                        {selectedFileName === file.name && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <FileRow file={file} />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Paste text section */}
        {inputTab === "paste" && (
          <div className="mb-5">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="请粘贴需要校对的公文内容..."
              className={cn(
                "w-full min-h-[200px] border border-line rounded-xl p-4 text-sm leading-relaxed",
                "bg-white/60 text-foreground placeholder:text-subtle",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                "transition-[border-color,box-shadow] duration-150 resize-y"
              )}
            />
            <p className="mt-2 text-xs text-subtle">已输入 {pastedText.length} 字</p>
          </div>
        )}

        {/* Proofread engine section */}
        <div>
          <h3 className="text-sm font-[660] mb-3">校对规则引擎</h3>
          <div className="grid grid-cols-1 gap-3">
            {proofreadEngines.map((engine) => {
              const active = selectedEngine === engine.id
              return (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => setSelectedEngine(active ? null : engine.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl p-3 text-left border cursor-pointer",
                    "transition-[background,border-color] duration-150",
                    active
                      ? "border-[rgba(200,60,78,0.36)] bg-accent-faint"
                      : "border-line bg-white/40 hover:bg-white/60"
                  )}
                >
                  <span
                    className={cn(
                      "w-[18px] h-[18px] rounded-full border-2 flex-none grid place-items-center",
                      "transition-[border-color,background] duration-150",
                      active
                        ? "border-accent-deep bg-accent-deep"
                        : "border-line bg-white"
                    )}
                  >
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="text-sm font-[620]">{engine.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom dictionary section */}
        <div className="pt-5">
          <h3 className="text-sm font-[660] mb-3">自定义规则词库</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {proofreadDictionaries.map((dict) => {
              const active = selectedDicts.has(dict.id)
              return (
                <button
                  key={dict.id}
                  type="button"
                  onClick={() => toggleDict(dict.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl p-3 text-left border cursor-pointer",
                    "transition-[background,border-color] duration-150",
                    active
                      ? "border-[rgba(200,60,78,0.36)] bg-accent-faint"
                      : "border-line bg-white/40 hover:bg-white/60"
                  )}
                >
                  <span
                    className={cn(
                      "w-[18px] h-[18px] rounded-[5px] border-2 flex-none grid place-items-center",
                      "transition-[border-color,background] duration-150",
                      active
                        ? "border-accent-deep bg-accent-deep"
                        : "border-line bg-white"
                    )}
                  >
                    {active && (
                      <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm font-[620]">{dict.name}</span>
                </button>
              )
            })}
            {/* New dictionary entry (placeholder) */}
            <button
              type="button"
              className={cn(
                "flex items-center gap-2.5 rounded-xl p-3 text-left border cursor-pointer",
                "border-dashed border-line bg-transparent hover:bg-white/40",
                "transition-[background] duration-150"
              )}
            >
              <span className="w-[18px] h-[18px] rounded-[5px] border-2 border-dashed border-line flex-none grid place-items-center">
                <Plus className="w-2.5 h-2.5 text-muted-text" />
              </span>
              <span className="text-sm font-[620] text-muted-text">新建词库</span>
            </button>
          </div>
        </div>
      </div>

      {/* Start button */}
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
        开始校对
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
