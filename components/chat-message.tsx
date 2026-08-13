"use client"

import { cn } from "@/lib/utils"
import { BookOpen, Copy, Download, Pencil, Check, Wrench, Brain } from "lucide-react"
import { useState, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ChatMessage as ChatMessageType, ToolCallInfo } from "@/types"

interface ChatMessageProps {
  message: ChatMessageType
  /** Whether the AI is still actively streaming this message */
  isStreaming?: boolean
}

// Strip <script> tags from markdown to avoid React warnings
// React never executes scripts during client rendering
const markdownComponents = {
  script: () => null,
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const { role, content, type, options } = message
  const isAssistant = role === "assistant"

  if (type === "options" && isAssistant && options) {
    return (
      <div className="flex justify-start">
        <div className="flex items-start gap-2.5">
          <span className="w-8 h-8 grid place-items-center rounded-lg bg-gradient-to-br from-[#d85061] to-[#aa2639] text-white flex-none mt-0.5">
            <BookOpen className="w-4 h-4" />
          </span>
          <div className="flex flex-wrap gap-2 max-w-[70%]">
            {options.map((option) => (
              <span
                key={option}
                className="px-3 py-1.5 text-xs bg-[#f5ede8] text-[#2c1810] rounded-full cursor-pointer hover:bg-[#e8ddd5] transition-colors"
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (type === "document" && isAssistant) {
    return <DocumentMessage content={content} />
  }

  return (
    <div className={cn("flex", isAssistant ? "justify-start" : "justify-end")}>
      <div className={cn("max-w-[80%]", isAssistant && "flex items-start gap-2.5")}>
        {isAssistant && (
          <span className="w-8 h-8 grid place-items-center rounded-lg bg-gradient-to-br from-[#d85061] to-[#aa2639] text-white flex-none mt-0.5">
            <BookOpen className="w-4 h-4" />
          </span>
        )}
        <div className="flex flex-col gap-1.5 min-w-0">
          {/* Thinking & Tool Calls — outside the bubble */}
          {isAssistant && (message.thinking || (message.toolCalls && message.toolCalls.length > 0)) && (
            <div className="pl-1 space-y-1.5">
              {message.thinking && <ThinkingBlock text={message.thinking} isStreaming={isStreaming && !!message.thinking} />}
              {message.toolCalls?.map((tc) => (
                <ToolCallBlock key={tc.id} tool={tc} />
              ))}
            </div>
          )}
          {/* Main bubble */}
          <div
            className={cn(
              "px-4 py-3 text-sm leading-relaxed",
              isAssistant
                ? "bg-muted text-foreground rounded-2xl rounded-tl-sm"
                : "bg-[#e8dfd8] text-[#2c1810] rounded-2xl rounded-tr-sm"
            )}
          >
            <div className="prose-chat">
              {isAssistant ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
              ) : (
                content
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Document Message — formal government document card ── */

function DocumentMessage({ content }: { content: string }) {
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const paperRef = useRef<HTMLDivElement>(null)

  const handleCopy = async () => {
    const text = paperRef.current?.innerText || ""
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleDownload = () => {
    const text = paperRef.current?.innerText || ""
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" })
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "公文初稿.txt"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] flex items-start gap-2.5">
        <span className="w-8 h-8 grid place-items-center rounded-lg bg-gradient-to-br from-[#d85061] to-[#aa2639] text-white flex-none mt-0.5">
          <BookOpen className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <article
            ref={paperRef}
            contentEditable={editing}
            className={cn(
              "rounded-2xl rounded-tl-sm border border-border",
              "bg-card text-card-foreground shadow-sm",
              "text-sm leading-[1.9] focus:outline-none",
              editing
                ? "whitespace-pre-wrap ring-2 ring-primary/30 shadow-md"
                : ""
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-border/60">
              <div className="w-5 h-5 grid place-items-center rounded bg-primary/10 text-primary flex-none">
                <BookOpen className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">公文初稿</span>
            </div>
            {/* Content */}
            <div className="px-5 py-4">
              {editing ? (
                content
              ) : (
                <div className="prose-chat">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
                </div>
              )}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 px-5 py-3 border-t border-border/60 bg-muted/30 rounded-b-2xl">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "已复制" : "复制"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                aria-pressed={editing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                {editing ? "完成" : "编辑"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                下载
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

/* ── Thinking Block — live while streaming ── */

interface ThinkingBlockProps {
  text: string
  /** true while the AI is still actively producing content */
  isStreaming?: boolean
}

function ThinkingBlock({ text, isStreaming }: ThinkingBlockProps) {
  const [userToggled, setUserToggled] = useState<boolean | null>(null)

  if (!text.trim()) return null

  // Auto-expand while streaming, auto-collapse when done (unless user manually toggled)
  const expanded = userToggled !== null ? userToggled : !!isStreaming

  return (
    <div className="flex items-start gap-1.5 text-[11px] leading-relaxed">
      <Brain className={cn("w-3 h-3 flex-none mt-0.5", isStreaming ? "text-[#d85061] animate-pulse" : "text-[#b0a3a8]")} />
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => setUserToggled(!expanded)}
          className="text-[#9a8d92] hover:text-[#6b5c52] cursor-pointer border-0 bg-transparent p-0 font-[600] text-[11px] transition-colors inline-flex items-center gap-1"
        >
          {isStreaming && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d85061] animate-pulse" />}
          思考过程 {expanded ? "▾" : "▸"}
        </button>
        {expanded && (
          <p className="mt-1 text-[#9a8d92] whitespace-pre-wrap break-words">
            {text}
            {isStreaming && <span className="inline-block w-[2px] h-[11px] bg-[#d85061] animate-pulse ml-0.5 align-middle" />}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Tool Call Block — live while running ── */

function ToolCallBlock({ tool }: { tool: ToolCallInfo }) {
  const [userToggled, setUserToggled] = useState<boolean | null>(null)
  const isRunning = tool.status === "running"

  // Auto-expand while running, auto-collapse when done (unless user manually toggled)
  const expanded = userToggled !== null ? userToggled : isRunning

  return (
    <div className="flex items-start gap-1.5 text-[11px] leading-relaxed">
      <Wrench className={cn("w-3 h-3 flex-none mt-0.5", isRunning ? "text-[#d85061] animate-pulse" : "text-[#b0a3a8]")} />
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => setUserToggled(!expanded)}
          className={cn(
            "cursor-pointer border-0 bg-transparent p-0 font-[600] text-[11px] transition-colors inline-flex items-center gap-1",
            isRunning ? "text-[#d85061]" : "text-[#9a8d92] hover:text-[#6b5c52]"
          )}
        >
          {isRunning ? (
            <span className="inline-flex items-center gap-[3px]">
              <span className="w-1 h-1 rounded-full bg-[#d85061] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-[#d85061] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-[#d85061] animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          ) : tool.status === "completed" ? (
            <span className="text-[#6b9a6b]">✓</span>
          ) : (
            <span className="text-[#c2384a]">✗</span>
          )}
          {isRunning ? "正在执行" : "调用"} {tool.toolName} {expanded ? "▾" : "▸"}
        </button>
        {expanded && (
          <div className="mt-1 space-y-0.5">
            {tool.toolArgs && (
              <p className="text-[#9a8d92] break-all">
                <span className="font-[600]">参数：</span>{tool.toolArgs.slice(0, 300)}
              </p>
            )}
            {tool.result && (
              <p className="text-[#9a8d92] break-all">
                <span className="font-[600]">结果：</span>{tool.result}
              </p>
            )}
            {isRunning && !tool.result && (
              <p className="text-[#b0a3a8] italic">
                执行中...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
