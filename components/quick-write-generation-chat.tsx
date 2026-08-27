"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { ArrowLeft, LayoutGrid, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch } from "@/hooks/use-app-state"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import type { ChatMessage as ChatMessageType } from "@/types"
import type { QuickWriteInput } from "@/lib/quick-write-data"
import {
  toGroups,
  generateSection,
  assembleDocument,
  type GenerationContext,
  type SectionResult,
} from "@/lib/template-writing-engine"

interface QuickWriteGenerationChatProps {
  input: QuickWriteInput
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
 * 快速写作"生成全文"轨道:进入后自动遍历模板章节一次性生成全文,再组装为 document 消息。
 * 不暴露逐章按钮(与模板写作的 TemplateWritingChat 区别在此)。后续对话为普通回复,
 * 不再参与模板冲突规则(docs §7.2 的"用户本次明确输入"层只在生成前生效)。
 *
 * ctx 不传 placeholderValues——fill 章节固定文本原样保留,未填占位符输出【待补:字段名】,
 * 全局提示词(additionalNotes)不进入 fill 章节文本,只叠加到 prompt 章节。
 */
export function QuickWriteGenerationChat({ input }: QuickWriteGenerationChatProps) {
  const dispatch = useAppDispatch()
  const groups = useMemo(() => toGroups(input.sections), [input.sections])
  const flatSections = input.sections

  const [results, setResults] = useState<Record<string, SectionResult>>(() => {
    const init: Record<string, SectionResult> = {}
    for (const s of flatSections) {
      init[s.id] = { sectionId: s.id, title: s.title, level: s.level, content: "", status: "pending" }
    }
    return init
  })
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [currentTitle, setCurrentTitle] = useState<string | null>(null)
  const [assembled, setAssembled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // ctx: placeholderValues 不传 → fill 章节占位符输出【待补:字段名】
  const ctx: GenerationContext = useMemo(
    () => ({
      documentTitle: input.documentTitle,
      draftingUnit: input.draftingUnit,
      additionalNotes: input.additionalNotes,
      referenceFileNames: [],
    }),
    [input],
  )

  const doneCount = Object.values(results).filter((r) => r.status === "done").length
  const totalCount = flatSections.length
  const isWorking = !assembled && doneCount < totalCount

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, results, currentTitle])

  const updateResult = useCallback((sectionId: string, patch: Partial<SectionResult>) => {
    setResults((prev) => ({ ...prev, [sectionId]: { ...prev[sectionId], ...patch } }))
  }, [])

  // mount 时自动一次性生成全部章节,再组装成全文(仅触发一次)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const collected: Record<string, SectionResult> = {}
      for (const s of flatSections) {
        if (cancelled) return
        setCurrentTitle(s.title)
        updateResult(s.id, { status: "generating", content: "" })
        try {
          const content = await generateSection(s, ctx)
          if (cancelled) return
          const r: SectionResult = { sectionId: s.id, title: s.title, level: s.level, content, status: "done" }
          collected[s.id] = r
          updateResult(s.id, { status: "done", content })
        } catch {
          updateResult(s.id, { status: "pending", content: "" })
        }
      }
      if (cancelled) return
      const groupResults: SectionResult[][] = groups.map((g) =>
        g.map((s) => collected[s.id]).filter(Boolean),
      )
      const doc = assembleDocument(input.documentTitle, input.draftingUnit, groupResults)
      setMessages((prev) => [
        ...prev,
        makeMessage("assistant", "公文初稿已生成,可在下方继续对话调整或直接编辑/复制。"),
        makeMessage("assistant", doc, "document"),
      ])
      setAssembled(true)
      setCurrentTitle(null)
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSend = (text: string) => {
    if (!text.trim()) return
    setMessages((prev) => [...prev, makeMessage("user", text)])
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        makeMessage(
          "assistant",
          assembled
            ? "已生成公文初稿。如需调整某部分,请说明具体修改方向。"
            : "正在生成全文,请稍候...",
        ),
      ])
    }, 500)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
        <button
          onClick={() => dispatch({ type: "SET_VIEW", view: "write-quick" })}
          className="p-1.5 rounded-lg hover:bg-accent-faint/40 transition-colors"
          title="返回快速写作"
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
        <span
          className={cn(
            "text-[11px] font-[580] px-2 py-0.5 rounded-full flex-none",
            assembled ? "text-emerald-700 bg-emerald-50" : "text-accent-deep bg-accent-soft",
          )}
        >
          {assembled ? "全文已生成" : `${doneCount} / ${totalCount} 章生成中`}
        </span>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {/* 生成进度 */}
        {isWorking && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-text pl-11">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              正在生成全文…{currentTitle ? `（当前：${currentTitle}）` : ""}
            </div>
            <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#cf4657] to-[#aa2639] transition-[width] duration-300"
                style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isWorking}
        placeholder={isWorking ? "正在生成全文..." : "输入修改要求,继续调整文稿..."}
      />
    </div>
  )
}
