"use client"

import { useState } from "react"
import { FileText, Upload, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReferenceFile } from "@/lib/template-data"
import type { KnowledgeFile } from "@/types"

type RefTab = "local" | "knowledge"

/**
 * Reference document uploader.
 * Reusable editor for attaching reference docs from local upload or the
 * knowledge base. Extracted from template-write-view Card 3.
 */
export function ReferenceFilesEditor({
  files,
  readOnly = false,
  onChange,
  knowledgeFiles,
}: {
  files: ReferenceFile[]
  readOnly?: boolean
  onChange: (files: ReferenceFile[]) => void
  knowledgeFiles: KnowledgeFile[]
}) {
  const [refTab, setRefTab] = useState<RefTab>("local")
  const [localRefName, setLocalRefName] = useState<string | null>(null)
  const [selectedKnowledgeName, setSelectedKnowledgeName] = useState<string | null>(null)

  // Defensive: stale (pre-migration) sections may pass undefined.
  const list = files ?? []
  const knowledge = knowledgeFiles ?? []

  const addLocalRef = () => {
    if (!localRefName) return
    if (list.some((f) => f.name === localRefName)) {
      setLocalRefName(null)
      return
    }
    onChange([...list, { source: "local", name: localRefName }])
    setLocalRefName(null)
  }

  const addKnowledgeRef = () => {
    if (!selectedKnowledgeName) return
    if (list.some((f) => f.name === selectedKnowledgeName)) {
      setSelectedKnowledgeName(null)
      return
    }
    onChange([...list, { source: "knowledge", name: selectedKnowledgeName }])
    setSelectedKnowledgeName(null)
  }

  const removeRef = (name: string) => onChange(list.filter((f) => f.name !== name))

  if (readOnly) {
    if (list.length === 0) return null
    return (
      <div className="mt-2">
        <p className="text-xs font-[620] text-muted-text mb-1.5">
          参考文档（{list.length}）
        </p>
        <div className="space-y-1.5">
          {list.map((f) => (
            <div
              key={f.name}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 bg-white/60 border border-line"
            >
              <FileText className="w-3.5 h-3.5 text-muted-text flex-none" />
              <span className="text-xs flex-1 min-w-0 truncate">{f.name}</span>
              <span className="text-[10px] text-subtle flex-none">
                {f.source === "local" ? "本地上传" : "知识库"}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <p className="text-xs font-[620] text-muted-text mb-1.5">参考文档</p>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-2.5">
        <button
          type="button"
          onClick={() => setRefTab("local")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-[11px] font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
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
            "px-2.5 py-1 rounded-lg text-[11px] font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
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
              "flex flex-col items-center justify-center gap-1.5",
              "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer",
              localRefName
                ? "border-success bg-[rgba(23,132,94,0.04)]"
                : "border-line hover:border-[rgba(200,60,78,0.36)] hover:bg-accent-faint",
              "transition-[border-color,background] duration-150"
            )}
          >
            {localRefName ? (
              <>
                <FileText className="w-5 h-5 text-success" />
                <span className="text-xs font-[620] text-foreground">{localRefName}</span>
                <span className="text-[10px] text-muted-text">点击重新选择</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-muted-text" />
                <span className="text-xs text-muted-text">
                  拖拽或<span className="text-accent-deep font-[620]">点击选择文件</span>
                </span>
                <span className="text-[10px] text-subtle">支持 .docx .pdf .txt</span>
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
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white/60 text-xs font-[620] cursor-pointer hover:bg-white/80 transition-[background] duration-150"
            >
              <Plus className="w-3 h-3" /> 添加此文件
            </button>
          )}
        </div>
      )}

      {/* Knowledge base */}
      {refTab === "knowledge" && (
        <div>
          {knowledge.length === 0 ? (
            <div className="py-4 text-center text-muted-text text-xs">知识库中暂无文件</div>
          ) : (
            <div className="border border-line rounded-xl overflow-hidden">
              {knowledge.map((file) => {
                const active = selectedKnowledgeName === file.name
                const alreadyAdded = list.some((f) => f.name === file.name)
                return (
                  <button
                    key={file.name}
                    type="button"
                    onClick={() => setSelectedKnowledgeName(active ? null : file.name)}
                    disabled={alreadyAdded}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 border-0 bg-transparent cursor-pointer text-left",
                      "border-b border-line last:border-b-0",
                      "transition-[background] duration-100",
                      alreadyAdded
                        ? "opacity-40 cursor-not-allowed"
                        : active
                          ? "bg-accent-faint"
                          : "hover:bg-white/60"
                    )}
                  >
                    <span
                      className={cn(
                        "w-3.5 h-3.5 rounded-full border-2 flex-none grid place-items-center",
                        "transition-[border-color,background] duration-150",
                        active ? "border-accent-deep bg-accent-deep" : "border-line bg-white"
                      )}
                    >
                      {active && <span className="w-1 h-1 rounded-full bg-white" />}
                    </span>
                    <span className="text-xs flex-1 min-w-0 truncate">{file.name}</span>
                    {alreadyAdded && (
                      <span className="text-[10px] text-muted-text flex-none">已添加</span>
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
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white/60 text-xs font-[620] cursor-pointer hover:bg-white/80 transition-[background] duration-150"
            >
              <Plus className="w-3 h-3" /> 添加此文件
            </button>
          )}
        </div>
      )}

      {/* Added list */}
      {list.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-line">
          <p className="text-[10px] font-[620] text-muted-text mb-1.5">
            已添加 {list.length} 个参考文档
          </p>
          <div className="space-y-1.5">
            {list.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-white/60 border border-line"
              >
                <FileText className="w-3.5 h-3.5 text-muted-text flex-none" />
                <span className="text-xs flex-1 min-w-0 truncate">{f.name}</span>
                <span className="text-[10px] text-subtle flex-none">
                  {f.source === "local" ? "本地上传" : "知识库"}
                </span>
                <button
                  type="button"
                  onClick={() => removeRef(f.name)}
                  className="w-4 h-4 rounded grid place-items-center text-muted-text hover:text-accent-deep hover:bg-white/60 cursor-pointer transition-[color,background] duration-150 flex-none"
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
  )
}
