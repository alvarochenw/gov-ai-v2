"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import {
  ArrowLeft,
  LayoutGrid,
  FileText,
  Sparkles,
  RefreshCw,
  Pencil,
  Check,
  Wand2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch } from "@/hooks/use-app-state"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { ReferenceFilesEditor } from "@/components/reference-files-editor"
import type { ChatMessage as ChatMessageType } from "@/types"
import type { TemplateWritingInput } from "@/lib/template-data"
import type { TemplateSection } from "@/data/template"
import {
  toGroups,
  generateSection,
  assembleDocument,
  wordRangeLabel,
  type GenerationContext,
  type SectionResult,
  type SectionStatus,
} from "@/lib/template-writing-engine"

interface TemplateWritingChatProps {
  input: TemplateWritingInput
}

function uid() {
  return crypto.randomUUID()
}

function makeMessage(
  role: "user" | "assistant",
  content: string,
  type: "text" | "document" = "text",
): ChatMessageType {
  return { id: uid(), role, content, type, timestamp: Date.now() }
}

export function TemplateWritingChat({ input }: TemplateWritingChatProps) {
  const dispatch = useAppDispatch()
  const groups = toGroups(input.sections)
  const flatSections = input.sections

  // Per-section result state keyed by section id
  const [results, setResults] = useState<Record<string, SectionResult>>(() => {
    const init: Record<string, SectionResult> = {}
    for (const s of flatSections) {
      init[s.id] = { sectionId: s.id, title: s.title, level: s.level, content: "", status: "pending" }
    }
    return init
  })
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [assembled, setAssembled] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const ctx: GenerationContext = useMemo(
    () => ({
      documentTitle: input.documentTitle,
      draftingUnit: input.draftingUnit,
      additionalNotes: input.additionalNotes,
      placeholderValues: input.placeholderValues,
      referenceFileNames: collectRefNames(flatSections),
    }),
    [input, flatSections],
  )

  const doneCount = Object.values(results).filter((r) => r.status === "done").length
  const totalCount = flatSections.length
  const allDone = doneCount === totalCount && totalCount > 0

  // Auto-scroll to bottom on changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, results, busyId])

  const updateResult = useCallback((sectionId: string, patch: Partial<SectionResult>) => {
    setResults((prev) => ({ ...prev, [sectionId]: { ...prev[sectionId], ...patch } }))
  }, [])

  /** Generate a single section (mock engine). */
  const generateOne = useCallback(
    async (section: TemplateSection) => {
      setBusyId(section.id)
      updateResult(section.id, { status: "generating", content: "" })
      try {
        const content = await generateSection(section, ctx)
        updateResult(section.id, { status: "done", content })
      } catch {
        updateResult(section.id, { status: "pending", content: "" })
      } finally {
        setBusyId(null)
      }
    },
    [ctx, updateResult],
  )

  /** Generate all sections sequentially, skipping already-done ones. */
  const generateAll = useCallback(async () => {
    for (const s of flatSections) {
      if (results[s.id]?.status === "done") continue
      await generateOne(s)
    }
  }, [flatSections, results, generateOne])

  /** Assemble all done sections into a document message. */
  const handleAssemble = useCallback(() => {
    const groupResults: SectionResult[][] = groups.map((g) =>
      g.map((s) => results[s.id]).filter(Boolean),
    )
    const doc = assembleDocument(input.documentTitle, input.draftingUnit, groupResults)
    setMessages((prev) => [
      ...prev,
      makeMessage("assistant", doc, "document"),
    ])
    setAssembled(true)
  }, [groups, results, input.documentTitle, input.draftingUnit])

  const handleSend = (text: string) => {
    if (!text.trim()) return
    setMessages((prev) => [...prev, makeMessage("user", text)])
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        makeMessage(
          "assistant",
          assembled
            ? "已生成公文初稿,可在上方编辑/复制/下载。如需调整某章节,点击对应章节的「编辑」或「重新生成」。"
            : "请先完成各章节生成并点击「组装公文初稿」,也可点击「逐章生成」自动推进。",
        ),
      ])
    }, 500)
  }

  const isWorking = busyId !== null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
        <button
          onClick={() => dispatch({ type: "SET_VIEW", view: "write-template" })}
          className="p-1.5 rounded-lg hover:bg-accent-faint/40 transition-colors"
          title="返回模板写作配置"
        >
          <ArrowLeft className="w-4 h-4 text-muted-text" />
        </button>
        <span className="w-7 h-7 grid place-items-center rounded-lg bg-accent-faint text-accent-deep flex-none">
          <LayoutGrid className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-[660] text-foreground truncate">
            {input.templateName}
          </h2>
          <p className="text-[11px] text-muted-text truncate">
            {input.documentTitle || "未命名公文"}
            {input.draftingUnit ? ` · ${input.draftingUnit}` : ""}
          </p>
        </div>
        <span className="text-[11px] font-[580] text-accent-deep bg-accent-soft px-2 py-0.5 rounded-full flex-none">
          {doneCount} / {totalCount} 章已完成
        </span>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {/* Section progress panel */}
        <div className="space-y-2.5">
          {groups.map((group, gi) => (
            <div key={group[0].id} className="space-y-1.5">
              {group.map((s, si) => {
                const isSub = s.level === 2
                const label = isSub ? `${gi + 1}.${si}` : `${gi + 1}`
                const r = results[s.id]
                return (
                  <SectionCard
                    key={s.id}
                    label={label}
                    section={s}
                    result={r}
                    busy={busyId === s.id}
                    editing={editingId === s.id}
                    editDraft={editDraft}
                    onGenerate={() => generateOne(s)}
                    onStartEdit={() => {
                      setEditingId(s.id)
                      setEditDraft(r.content)
                    }}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={() => {
                      updateResult(s.id, { content: editDraft, status: "done" })
                      setEditingId(null)
                    }}
                    onChangeDraft={setEditDraft}
                    isSub={isSub}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={generateAll}
            disabled={isWorking || allDone}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-[620] transition-[background,opacity] duration-150",
              isWorking || allDone
                ? "bg-muted/40 text-muted-text cursor-not-allowed"
                : "bg-gradient-to-r from-[#cf4657] to-[#aa2639] text-white hover:from-[#c23b4d] hover:to-[#981f32] cursor-pointer shadow-sm",
            )}
          >
            <Wand2 className="w-3.5 h-3.5" />
            {allDone ? "全部已生成" : "逐章生成"}
          </button>
          <button
            type="button"
            onClick={handleAssemble}
            disabled={!allDone || assembled}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-[620] border transition-[background,opacity] duration-150",
              !allDone || assembled
                ? "border-line bg-muted/30 text-muted-text cursor-not-allowed"
                : "border-accent-deep/30 bg-white text-accent-deep hover:bg-accent-faint/40 cursor-pointer",
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            组装公文初稿
          </button>
        </div>

        {/* Chat messages (assembled document + follow-up dialogue) */}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isWorking && (
          <div className="flex items-center gap-2 text-xs text-muted-text pl-11">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            正在生成章节...
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isWorking}
        placeholder={assembled ? "可输入修改要求,或下载上方初稿..." : "完成生成并组装后可继续对话微调..."}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section card                                                       */
/* ------------------------------------------------------------------ */

interface SectionCardProps {
  label: string
  section: TemplateSection
  result: SectionResult
  busy: boolean
  editing: boolean
  editDraft: string
  isSub: boolean
  onGenerate: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onChangeDraft: (v: string) => void
}

function SectionCard({
  label,
  section,
  result,
  busy,
  editing,
  editDraft,
  isSub,
  onGenerate,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onChangeDraft,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const status = result.status
  const range = wordRangeLabel(section.wordCountMin, section.wordCountMax)
  const hasContent = result.content.trim().length > 0

  return (
    <div
      className={cn(
        "rounded-xl border bg-white/70 transition-[border-color,box-shadow] duration-150",
        status === "generating"
          ? "border-[rgba(200,60,78,0.36)] shadow-sm"
          : status === "done"
            ? "border-line"
            : "border-line",
        isSub && "ml-6",
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className={cn("text-[11px] font-[680] text-muted-text w-6 text-center flex-none", isSub && "text-[10px]")}>
          {label}
        </span>
        <FileText className="w-3.5 h-3.5 text-muted-text flex-none" />
        <span className={cn("text-xs flex-1 min-w-0 truncate", isSub ? "text-muted-text font-[560]" : "text-foreground font-[600]")}>
          {section.title || "（无标题）"}
        </span>
        {range && <span className="text-[10px] text-subtle flex-none">{range}</span>}
        {section.writingMode === "fill" && (
          <span className="text-[10px] text-accent-deep/70 flex-none">占位符</span>
        )}
        <StatusBadge status={status} />
      </div>

      {/* Generated content preview */}
      {hasContent && !editing && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-muted-text hover:text-foreground transition-colors mb-1"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? "收起" : "展开预览"}
          </button>
          {expanded && (
            <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-2.5">
              {result.content}
            </p>
          )}
        </div>
      )}

      {/* Inline edit textarea */}
      {editing && (
        <div className="px-3 pb-2">
          <textarea
            value={editDraft}
            onChange={(e) => onChangeDraft(e.target.value)}
            className={cn(
              "w-full min-h-[80px] text-xs leading-relaxed rounded-lg p-2.5 resize-y",
              "bg-white/70 border border-line focus:outline-none focus:border-[rgba(200,60,78,0.36)]",
              "focus:ring-2 focus:ring-[rgba(200,60,78,0.08)] transition-[border-color,box-shadow]",
            )}
          />
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="button"
              onClick={onSaveEdit}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-[600] text-white bg-gradient-to-r from-[#cf4657] to-[#aa2639]"
            >
              <Check className="w-3 h-3" /> 保存
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-[600] text-muted-text border border-line bg-white/60"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 参考文件(仅一级标题,只读显示) */}
      {!isSub && !editing && (
        <div className="px-3 pb-1">
          <ReferenceFilesEditor
            files={section.referenceFiles ?? []}
            readOnly
            onChange={() => {}}
            knowledgeFiles={[]}
          />
        </div>
      )}

      {/* Action row */}
      {!editing && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-line/60">
          <button
            type="button"
            onClick={onGenerate}
            disabled={busy}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-[600] transition-[background,opacity] duration-150",
              busy
                ? "bg-muted/40 text-muted-text cursor-not-allowed"
                : "bg-accent-soft text-accent-deep hover:bg-accent-soft/70 cursor-pointer",
            )}
          >
            {busy ? <Sparkles className="w-3 h-3 animate-pulse" /> : <Sparkles className="w-3 h-3" />}
            {status === "done" ? "重新生成" : status === "generating" ? "生成中..." : "生成"}
          </button>
          {hasContent && (
            <button
              type="button"
              onClick={onStartEdit}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-[600] text-muted-text border border-line bg-white/60 hover:text-foreground cursor-pointer transition-colors"
            >
              <Pencil className="w-3 h-3" /> 编辑
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: SectionStatus }) {
  if (status === "generating") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-[600] text-accent-deep bg-accent-soft px-1.5 py-0.5 rounded flex-none">
        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> 生成中
      </span>
    )
  }
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-[600] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex-none">
        <Check className="w-2.5 h-2.5" /> 已完成
      </span>
    )
  }
  return (
    <span className="text-[10px] font-[580] text-subtle bg-muted/40 px-1.5 py-0.5 rounded flex-none">
      待生成
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function collectRefNames(sections: TemplateSection[]): string[] {
  const set = new Set<string>()
  for (const s of sections) {
    if (s.level !== 1) continue
    for (const f of s.referenceFiles) set.add(f.name)
  }
  return Array.from(set)
}
