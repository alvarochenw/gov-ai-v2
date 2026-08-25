"use client"

import { useState, useRef } from "react"
import { Upload, Library, FileText, Braces, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SectionWritingMode } from "@/data/template"
import type { KnowledgeFile } from "@/types"
import {
  Dialog, DialogContent, DialogTitle,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ExtractTemplateDialogProps {
  open: boolean
  isExtracting: boolean
  knowledgeFiles: KnowledgeFile[]
  onOpenChange: (open: boolean) => void
  /** 是否显示「提示词/文本+占位符」模式选择(结构模板用,风格模板不用)。默认 true。 */
  showMode?: boolean
  /** 本地上传且已选文件时触发;mode 为用户选择的写作模式(showMode=false 时为默认 prompt)。 */
  onConfirm: (file: File, mode: SectionWritingMode) => void
}

type Source = "local" | "knowledge"

export function ExtractTemplateDialog({
  open, isExtracting, knowledgeFiles, onOpenChange, onConfirm, showMode = true,
}: ExtractTemplateDialogProps) {
  const [source, setSource] = useState<Source>("local")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedKfName, setSelectedKfName] = useState<string | null>(null)
  const [mode, setMode] = useState<SectionWritingMode>("prompt")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const knowledgeList = knowledgeFiles.filter((f) => f.type !== "folder")

  // 弹窗关闭时重置内部状态(onOpenChange 拦截,避免在 effect 里 setState)
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedFile(null)
      setSelectedKfName(null)
      setSource("local")
      setMode("prompt")
    }
    onOpenChange(next)
  }

  // 仅本地上传 + 已选文件时可提取;知识库因暂无可读取内容,禁用
  const canConfirm = source === "local" && !!selectedFile && !isExtracting

  const handleConfirm = () => {
    if (!canConfirm || !selectedFile) return
    onConfirm(selectedFile, mode)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "block gap-0 p-0 overflow-hidden",
          "sm:max-w-[520px] w-[min(520px,94vw)] max-h-[88vh] flex flex-col",
          "bg-background border border-line rounded-2xl"
        )}
      >
        <div className="flex items-center justify-between px-6 h-14 flex-none border-b border-line">
          <DialogTitle className="text-base font-[680] text-foreground">AI 从文件提取</DialogTitle>
          <DialogClose
            className="w-8 h-8 -mr-2 grid place-items-center rounded-lg text-muted-text hover:text-accent-deep hover:bg-white/60 cursor-pointer transition-[color,background] duration-150"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">关闭</span>
          </DialogClose>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* 来源选择 */}
          <section>
            <h4 className="text-xs font-[620] text-muted-text mb-2.5">选择文档来源</h4>
            <div className="grid grid-cols-2 gap-2.5">
              <SourceOption
                active={source === "local"} onClick={() => setSource("local")}
                icon={Upload} label="本地上传" desc="从电脑选择 .docx 文件"
              />
              <SourceOption
                active={source === "knowledge"} onClick={() => setSource("knowledge")}
                icon={Library} label="从知识库选择" desc="选择已入库的文件"
              />
            </div>

            {source === "local" ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-full min-h-[80px] rounded-xl border border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer",
                    "transition-[border-color,color,background] duration-150",
                    selectedFile
                      ? "border-success bg-[rgba(23,132,94,0.04)]"
                      : "border-line text-muted-text hover:border-[rgba(200,60,78,0.30)] hover:text-accent-deep hover:bg-white/60"
                  )}
                >
                  {selectedFile ? (
                    <>
                      <FileText className="w-5 h-5 text-success" />
                      <span className="text-sm font-[620] text-foreground truncate max-w-full px-3">{selectedFile.name}</span>
                      <span className="text-[11px] text-subtle">点击重新选择</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="text-sm font-[620]">点击选择文件</span>
                      <span className="text-[11px] text-subtle">支持 .docx 格式</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf,.txt"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setSelectedFile(file)
                    e.target.value = ""
                  }}
                />
              </div>
            ) : (
              <div className="mt-3">
                {knowledgeList.length === 0 ? (
                  <p className="text-xs text-muted-text text-center py-6 border border-dashed border-line rounded-xl">知识库暂无文件</p>
                ) : (
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                    {knowledgeList.map((f) => (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => setSelectedKfName(f.name)}
                        className={cn(
                          "w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left cursor-pointer transition-[border-color,background] duration-150",
                          selectedKfName === f.name
                            ? "border-[rgba(200,60,78,0.26)] bg-accent-faint"
                            : "border-line bg-white/60 hover:bg-white"
                        )}
                      >
                        <FileText className="w-4 h-4 text-muted-text flex-none" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-[620] text-foreground truncate">{f.name}</p>
                          <p className="text-[10px] text-subtle">{f.size} · {f.addedAt}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedKfName && (
                  <p className="mt-2 text-[11px] text-accent-deep leading-relaxed bg-accent-faint rounded-lg px-2.5 py-1.5">
                    该文件暂无可读取内容,暂不支持从知识库提取。请改用「本地上传」。
                  </p>
                )}
              </div>
            )}
          </section>

          {/* 模式选择(可选,结构模板用) */}
          {showMode && (
            <section>
              <h4 className="text-xs font-[620] text-muted-text mb-2.5">提取后章节写作模式</h4>
              <div className="grid grid-cols-2 gap-2.5">
                <ModeOption
                  active={mode === "prompt"} onClick={() => setMode("prompt")}
                  icon={FileText} label="提示词模式"
                  desc="每章节用提示词描述生成要求"
                />
                <ModeOption
                  active={mode === "fill"} onClick={() => setMode("fill")}
                  icon={Braces} label="文本+占位符"
                  desc="每章节用固定文本+{{占位符}}"
                />
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row justify-end gap-2 px-6 py-4 border-t border-line">
          <DialogClose render={(props: React.ComponentProps<"button">) => <Button variant="outline" size="default" {...props} />}>取消</DialogClose>
          <Button size="default" onClick={handleConfirm} disabled={!canConfirm}>
            {isExtracting ? <><Loader2 className="w-4 h-4 animate-spin" /> 提取中</> : "开始提取"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SourceOption({ active, onClick, icon: Icon, label, desc }: {
  active: boolean; onClick: () => void; icon: typeof Upload; label: string; desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-2.5 p-3 rounded-xl border text-left cursor-pointer transition-[border-color,background] duration-150",
        active ? "border-[rgba(200,60,78,0.26)] bg-accent-faint" : "border-line bg-white/60 hover:bg-white"
      )}
    >
      <Icon className={cn("w-4 h-4 flex-none mt-0.5", active ? "text-accent-deep" : "text-muted-text")} />
      <div>
        <p className="text-xs font-[620] text-foreground">{label}</p>
        <p className="text-[10px] text-subtle leading-relaxed mt-0.5">{desc}</p>
      </div>
    </button>
  )
}

function ModeOption({ active, onClick, icon: Icon, label, desc }: {
  active: boolean; onClick: () => void; icon: typeof FileText; label: string; desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-2.5 p-3 rounded-xl border text-left cursor-pointer transition-[border-color,background] duration-150",
        active ? "border-[rgba(200,60,78,0.26)] bg-accent-faint" : "border-line bg-white/60 hover:bg-white"
      )}
    >
      <Icon className={cn("w-4 h-4 flex-none mt-0.5", active ? "text-accent-deep" : "text-muted-text")} />
      <div>
        <p className="text-xs font-[620] text-foreground">{label}</p>
        <p className="text-[10px] text-subtle leading-relaxed mt-0.5">{desc}</p>
      </div>
    </button>
  )
}
