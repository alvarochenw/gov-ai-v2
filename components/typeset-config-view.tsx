"use client"

import { useState } from "react"
import { LayoutGrid, ArrowRight, Upload, FileText, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppState, useAppDispatch } from "@/hooks/use-app-state"
import { FileRow } from "@/components/file-row"
import { typesetTemplates, redHeadTemplates } from "@/data/typeset"

type InputTab = "upload" | "paste"
type UploadTab = "local" | "knowledge"

/** Mini document preview skeleton inside each template card */
function DocSkeleton() {
  return (
    <div className="mt-3 space-y-1.5 px-1">
      {/* Title line */}
      <div className="h-2 w-[55%] rounded-full bg-[#e8e2e5]" />
      {/* Body lines */}
      <div className="h-1.5 w-full rounded-full bg-[#ede9eb]" />
      <div className="h-1.5 w-[92%] rounded-full bg-[#ede9eb]" />
      <div className="h-1.5 w-[78%] rounded-full bg-[#ede9eb]" />
      <div className="h-1.5 w-[85%] rounded-full bg-[#ede9eb]" />
    </div>
  )
}

/** Red-head document preview skeleton — red accent top bar + warm-tinted body lines */
function RedHeadSkeleton() {
  return (
    <div className="mt-3 space-y-1.5 px-1">
      {/* Red-head bar */}
      <div className="h-2 w-full rounded-full bg-[rgba(200,60,78,0.22)]" />
      {/* Body lines */}
      <div className="h-1.5 w-[55%] rounded-full bg-[#e8e2e5]" />
      <div className="h-1.5 w-full rounded-full bg-[#ede9eb]" />
      <div className="h-1.5 w-[92%] rounded-full bg-[#ede9eb]" />
      <div className="h-1.5 w-[78%] rounded-full bg-[#ede9eb]" />
    </div>
  )
}

export function TypesetConfigView() {
  const dispatch = useAppDispatch()
  const state = useAppState()

  const [inputTab, setInputTab] = useState<InputTab>("upload")
  const [uploadTab, setUploadTab] = useState<UploadTab>("local")
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [pastedText, setPastedText] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("gb9702")
  const [selectedRedHead, setSelectedRedHead] = useState<string | null>(null)

  const handleStart = () => {
    // For now, navigate to chat with the typeset prompt
    dispatch({ type: "SET_VIEW", view: "chat" })
  }

  const canStart =
    (inputTab === "paste" && pastedText.trim().length > 0) ||
    (inputTab === "upload" && uploadTab === "knowledge" && selectedFileName !== null) ||
    (inputTab === "upload" && uploadTab === "local" && selectedFileName !== null)

  return (
    <div className="w-[min(960px,100%)] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-14 h-14 grid place-items-center rounded-2xl text-accent-deep bg-accent-soft">
          <LayoutGrid className="w-7 h-7" />
        </span>
        <div>
          <h1 className="text-2xl font-[760] tracking-[-0.03em]">智能排版</h1>
          <p className="mt-1 text-muted-text text-sm">
            上传公文或粘贴文本，选择排版模板，一键规范公文格式
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
              placeholder="请粘贴需要排版的公文内容..."
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

        {/* Template selection section */}
        <div>
          <h3 className="text-sm font-[660] mb-3">排版模板</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {typesetTemplates.map((tpl) => {
              const active = selectedTemplate === tpl.id
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={cn(
                    "relative rounded-xl p-4 text-left border cursor-pointer",
                    "transition-[background,border-color] duration-150",
                    active
                      ? "border-[rgba(200,60,78,0.36)] bg-accent-faint"
                      : "border-line bg-white/40 hover:bg-white/60"
                  )}
                >
                  {/* Selected check badge */}
                  {active && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 grid place-items-center rounded-full bg-accent-deep text-white">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                  )}
                  <span className="text-[13px] font-[660] leading-snug block">{tpl.name}</span>
                  <span className="text-[11px] text-muted-text block mt-1">{tpl.description}</span>
                  <DocSkeleton />
                </button>
              )
            })}
            {/* New template placeholder */}
            <button
              type="button"
              className={cn(
                "relative rounded-xl p-4 text-left border cursor-pointer",
                "border-dashed border-line bg-transparent hover:bg-white/40",
                "transition-[background] duration-150"
              )}
            >
              <div className="flex flex-col items-center justify-center gap-2 pt-4 pb-2">
                <span className="w-8 h-8 grid place-items-center rounded-full border-2 border-dashed border-line">
                  <Plus className="w-4 h-4 text-muted-text" />
                </span>
                <span className="text-[13px] font-[620] text-muted-text">新建模板</span>
              </div>
            </button>
          </div>
        </div>

        {/* Red-head template section (optional) */}
        <div className="pt-5">
          <h3 className="text-sm font-[660] mb-3">套红模板<span className="text-muted-text font-[400] ml-1.5">（可选）</span></h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {redHeadTemplates.map((tpl) => {
              const active = selectedRedHead === tpl.id
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedRedHead(active ? null : tpl.id)}
                  className={cn(
                    "relative rounded-xl p-4 text-left border cursor-pointer",
                    "transition-[background,border-color] duration-150",
                    active
                      ? "border-[rgba(200,60,78,0.36)] bg-accent-faint"
                      : "border-line bg-white/40 hover:bg-white/60"
                  )}
                >
                  {active && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 grid place-items-center rounded-full bg-accent-deep text-white">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                  )}
                  <span className="text-[13px] font-[660] block">{tpl.name}</span>
                  <RedHeadSkeleton />
                </button>
              )
            })}
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
        开始排版
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
