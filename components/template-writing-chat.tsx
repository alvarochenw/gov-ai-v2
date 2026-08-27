"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import {
  LayoutGrid,
  FileText,
  Sparkles,
  RefreshCw,
  Check,
  Wand2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
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

/**
 * 第三步「生成初稿」的主体。作为 TemplateWriteView 的内部步骤渲染,
 * 与第一、二步共用同一 shell(header / 面包屑由 TemplateWriteView 提供),
 * 因此本组件只输出主体内容,不再自带页头与固定输入框。
 */
export function TemplateWritingChat({ input }: TemplateWritingChatProps) {
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
  const bottomRef = useRef<HTMLDivElement>(null)

  const ctx: GenerationContext = useMemo(
    () => ({
      documentTitle: input.documentTitle,
      draftingUnit: input.draftingUnit,
      additionalNotes: input.additionalNotes,
      placeholderValues: input.placeholderValues,
      referenceFileNames: input.referenceFiles.map((f) => f.name),
    }),
    [input],
  )

  const doneCount = Object.values(results).filter((r) => r.status === "done").length
  const totalCount = flatSections.length
  const allDone = doneCount === totalCount && totalCount > 0

  // 流式输出时滚动外层 <main> 跟随最新内容(本组件为页面流,自身不滚动)。
  useEffect(() => {
    const main = bottomRef.current?.closest("main")
    if (main) main.scrollTop = main.scrollHeight
  }, [messages, results, busyId])

  const updateResult = useCallback((sectionId: string, patch: Partial<SectionResult>) => {
    setResults((prev) => ({ ...prev, [sectionId]: { ...prev[sectionId], ...patch } }))
  }, [])

  /** Generate a single section (mock engine) — 流式追加输出。 */
  const generateOne = useCallback(
    async (section: TemplateSection) => {
      setBusyId(section.id)
      updateResult(section.id, { status: "generating", content: "" })
      try {
        const full = await generateSection(section, ctx)
        // 流式输出:分块逐步追加,让用户看到生成过程(status 仍为 generating)
        const chunks = chunkByChars(full, 8)
        let acc = ""
        for (const c of chunks) {
          acc += c
          updateResult(section.id, { content: acc })
          await sleep(30)
        }
        updateResult(section.id, { status: "done", content: full })
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
            ? "已生成公文初稿,可在上方编辑/复制/下载。如需调整某章节,点击对应章节的「重新生成」。"
            : "请先完成各章节生成并点击「组装公文初稿」,也可点击「逐章生成」自动推进。",
        ),
      ])
    }, 500)
  }

  const isWorking = busyId !== null

  return (
    <div className="space-y-4">
      {/* Context + progress */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="w-7 h-7 grid place-items-center rounded-lg bg-accent-faint text-accent-deep flex-none">
          <LayoutGrid className="w-4 h-4" />
        </span>
        <span className="text-sm font-[620] text-foreground truncate">{input.templateName}</span>
        <span className="text-xs font-[580] text-accent-deep bg-accent-soft px-2.5 py-1 rounded-full flex-none whitespace-nowrap ml-auto">
          {doneCount} / {totalCount} 章已完成
        </span>
      </div>

      {/* Section cards */}
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
                  onGenerate={() => generateOne(s)}
                  isSub={isSub}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={generateAll}
          disabled={isWorking || allDone}
          className={cn(
            "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-[620] transition-[background,opacity] duration-150",
            isWorking || allDone
              ? "bg-muted/40 text-muted-text cursor-not-allowed"
              : "bg-gradient-to-r from-[#cf4657] to-[#aa2639] text-white hover:from-[#c23b4d] hover:to-[#981f32] cursor-pointer shadow-sm",
          )}
        >
          <Wand2 className="w-4 h-4" />
          {allDone ? "全部已生成" : "逐章生成"}
        </button>
        <button
          type="button"
          onClick={handleAssemble}
          disabled={!allDone || assembled}
          className={cn(
            "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-[620] border transition-[background,opacity] duration-150",
            !allDone || assembled
              ? "border-line bg-muted/30 text-muted-text cursor-not-allowed"
              : "border-accent-deep/30 bg-white text-accent-deep hover:bg-accent-faint/40 cursor-pointer",
          )}
        >
          <Sparkles className="w-4 h-4" />
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

      {/* Inline follow-up input(非固定,随页面流) */}
      <ChatInput
        onSend={handleSend}
        disabled={isWorking}
        placeholder={assembled ? "可输入修改要求,或下载上方初稿..." : "完成生成并组装后可继续对话微调..."}
      />

      <div ref={bottomRef} />
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
  isSub: boolean
  onGenerate: () => void
}

function SectionCard({
  label,
  section,
  result,
  busy,
  isSub,
  onGenerate,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(true)
  const status = result.status
  const range = wordRangeLabel(section.wordCountMin, section.wordCountMax)
  const hasContent = result.content.trim().length > 0

  // 生成时自动展开,保证流式输出可见
  useEffect(() => {
    if (busy) setExpanded(true)
  }, [busy])

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white/80 transition-[border-color,box-shadow] duration-150",
        status === "generating"
          ? "border-[rgba(200,60,78,0.36)] shadow-sm"
          : "border-line",
        isSub && "ml-6",
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className={cn("text-xs font-[680] text-muted-text w-6 text-center flex-none", isSub && "text-[11px]")}>
          {label}
        </span>
        <FileText className="w-4 h-4 text-muted-text flex-none" />
        <span className={cn("flex-1 min-w-0 truncate", isSub ? "text-xs text-muted-text font-[560]" : "text-sm text-foreground font-[600]")}>
          {section.title || "（无标题）"}
        </span>
        {range && <span className="text-[11px] text-subtle flex-none">{range}</span>}
        {section.writingMode === "fill" && (
          <span className="text-[11px] text-accent-deep/70 flex-none">占位符</span>
        )}
        <StatusBadge status={status} />
      </div>

      {/* Generated content preview */}
      {hasContent && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-text hover:text-foreground transition-colors mb-1.5"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {expanded ? "收起" : "展开预览"}
          </button>
          {expanded && (
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
              {result.content}
            </p>
          )}
        </div>
      )}

      {/* 章节参考文档已移除(模板写作不再携带章节级参考文件) */}

      {/* Action row — 重新生成(仅已生成章节) */}
      {hasContent && !busy && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-line/60">
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-[600] text-muted-text border border-line bg-white/60 hover:text-foreground hover:bg-white/80 cursor-pointer transition-[background,color] duration-150"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 重新生成
          </button>
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
      <span className="inline-flex items-center gap-1 text-[11px] font-[600] text-accent-deep bg-accent-soft px-2 py-0.5 rounded-full flex-none">
        <RefreshCw className="w-3 h-3 animate-spin" /> 生成中
      </span>
    )
  }
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-[600] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex-none">
        <Check className="w-3 h-3" /> 已完成
      </span>
    )
  }
  return (
    <span className="text-[11px] font-[580] text-subtle bg-muted/40 px-2 py-0.5 rounded-full flex-none">
      待生成
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Split text into chunks of N unicode chars (Chinese-safe) for streaming reveal. */
function chunkByChars(text: string, n: number): string[] {
  const chars = Array.from(text)
  const chunks: string[] = []
  for (let i = 0; i < chars.length; i += n) {
    chunks.push(chars.slice(i, i + n).join(""))
  }
  return chunks
}
