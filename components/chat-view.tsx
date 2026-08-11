"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { ArrowLeft, Sparkles, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppState, useAppDispatch } from "@/hooks/use-app-state"
import { useAgentChat } from "@/hooks/use-agent-chat"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { consumePendingChatPrompt } from "@/lib/pending-prompt"
import type { ChatMessage as ChatMessageType, ChatSession } from "@/types"

// ─── Mock step data (kept for non-公文专家 modes) ────────────────

interface Step {
  prompt: string
  type: "text" | "options" | "document"
  options?: string[]
}

function createMessage(
  role: "user" | "assistant",
  content: string,
  type: "text" | "options" | "document" = "text",
  options?: string[],
): ChatMessageType {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    type,
    options,
    timestamp: Date.now(),
  }
}

const modeSteps: Record<string, Step[]> = {
  快速写作: [
    {
      prompt: "请问您需要起草什么类型的公文？",
      type: "options",
      options: ["通知", "请示", "报告", "函", "纪要"],
    },
    {
      prompt: "请简述公文的主要事项和背景信息：",
      type: "text",
    },
  ],
  模板写作: [
    {
      prompt: "请选择公文文种模板：",
      type: "options",
      options: ["通知模板", "请示模板", "报告模板", "函模板"],
    },
    {
      prompt: "请填写公文的核心内容要点：",
      type: "text",
    },
  ],
  风格写作: [
    {
      prompt: "请选择或描述所需的写作风格：",
      type: "options",
      options: ["正式机关口径", "领导讲话风格", "简报精炼风格"],
    },
    {
      prompt: "请输入公文的主要事项和具体要求：",
      type: "text",
    },
  ],
  以文写文: [
    {
      prompt: "请上传参考范文或描述参考材料的内容：",
      type: "text",
    },
    {
      prompt: "请说明新文稿需要调整的方向和要求：",
      type: "text",
    },
  ],
}

const demoDocument = `关于开展政务数据安全专项检查的通知

各有关单位：

为进一步加强政务数据安全管理，压实安全责任，及时排查风险隐患，现就开展政务数据安全专项检查有关事项通知如下。

一、明确检查重点

重点检查数据分类分级、账号权限、系统运行、数据共享和安全事件处置等工作落实情况。各单位要结合实际全面梳理，不留盲区。

二、落实时间安排

各单位应于本月15日前完成自查，于本月20日前报送问题清单和整改计划。信息中心将组织抽查并反馈整改意见。

三、压实工作责任

主要负责同志要履行第一责任人职责，明确专人负责，实行问题闭环管理。对发现的重要风险，应立即报告并妥善处置。`

// ─── Component ────────────────────────────────────────────────────

export function ChatView() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { messages, chatMode, expert, activeSessionId } = state
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  // ── Agent API integration ──
  const isAgentMode = expert === "智能公文专家"
  const agentChat = useAgentChat({
    initialGreeting: isAgentMode
      ? createMessage("assistant", "您好！我是智能公文专家，可以帮您起草各类公文。请告诉我您需要起草什么类型的公文，或者直接描述您的需求。")
      : undefined,
  })

  const steps = modeSteps[chatMode] || modeSteps["快速写作"]

  // Initialize the first AI message on mount (mock mode only)
  useEffect(() => {
    if (!isAgentMode && messages.length === 0 && steps.length > 0) {
      const firstStep = steps[0]
      dispatch({
        type: "ADD_MESSAGE",
        message: createMessage("assistant", firstStep.prompt, firstStep.type, firstStep.options),
      })
      setCurrentStep(0)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-send pending prompt from home Composer (agent mode only)
  const hasAutoSentRef = useRef(false)
  useEffect(() => {
    if (isAgentMode && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true
      const pending = consumePendingChatPrompt()
      if (pending) {
        setTimeout(() => agentChat.sendMessage(pending), 300)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll: only when user is near bottom ──
  const isAtBottomRef = useRef(true)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // Consider "at bottom" if within 80px of the bottom
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  useEffect(() => {
    if (scrollRef.current && isAtBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [isAgentMode ? agentChat.messages : messages, agentChat.isStreaming, isGenerating])

  // ── Auto-save session when messages change ──
  const prevMessageCountRef = useRef(0)
  const displayMessages = isAgentMode ? agentChat.messages : messages
  useEffect(() => {
    const count = displayMessages.length
    if (count > 0 && count !== prevMessageCountRef.current) {
      prevMessageCountRef.current = count

      // Derive title from first user message
      const firstUserMsg = displayMessages.find((m) => m.role === "user")
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "")
        : "新会话"

      const now = Date.now()
      const session: ChatSession = {
        id: activeSessionId ?? crypto.randomUUID(),
        title,
        expert,
        mode: chatMode,
        createdAt: state.sessions.find((s) => s.id === activeSessionId)?.createdAt ?? now,
        updatedAt: now,
        messages: displayMessages,
      }

      if (!activeSessionId) {
        dispatch({ type: "SET_ACTIVE_SESSION", id: session.id })
      }
      dispatch({ type: "SAVE_SESSION", session })
    }
  }, [displayMessages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mock mode: step-by-step flow ──
  const advanceStep = useCallback(
    (userContent: string) => {
      dispatch({
        type: "ADD_MESSAGE",
        message: createMessage("user", userContent),
      })

      const nextStepIndex = currentStep + 1

      if (nextStepIndex < steps.length) {
        const nextStep = steps[nextStepIndex]
        setTimeout(() => {
          dispatch({
            type: "ADD_MESSAGE",
            message: createMessage("assistant", nextStep.prompt, nextStep.type, nextStep.options),
          })
          setCurrentStep(nextStepIndex)
        }, 400)
      } else {
        setIsGenerating(true)
        setTimeout(() => {
          dispatch({
            type: "ADD_MESSAGE",
            message: createMessage("assistant", "公文初稿已生成，您可以继续对话修改，或直接编辑/下载。", "text"),
          })
          dispatch({
            type: "ADD_MESSAGE",
            message: createMessage("assistant", demoDocument, "document"),
          })
          setIsGenerating(false)
        }, 1200)
      }
    },
    [currentStep, steps, dispatch],
  )

  // ── Unified send handler ──
  const handleSend = (text: string) => {
    if (isAgentMode) {
      agentChat.sendMessage(text)
    } else {
      if (isGenerating) return
      advanceStep(text)
    }
  }

  const isWorking = isAgentMode ? agentChat.isStreaming : isGenerating

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f0e8e3]">
        <button
          onClick={() => dispatch({ type: "SET_VIEW", view: "sessions" })}
          className="p-1.5 rounded-lg hover:bg-[#f5ede8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#6b5c52]" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-[#2c1810] truncate">{expert}</h2>
        </div>
        {isAgentMode && agentChat.sessionId && (
          <span className="text-[10px] text-[#8b7b6e] bg-[#f5ede8] px-2 py-0.5 rounded-full">
            会话已建立
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {displayMessages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isWorking && (
          <div className="flex items-center gap-2 text-xs text-[#8b7b6e] pl-11">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            {isAgentMode ? "AI 正在思考..." : "正在生成公文..."}
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      <ScrollToBottom scrollRef={scrollRef} isAtBottomRef={isAtBottomRef} />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isWorking}
        placeholder={
          isWorking
            ? "正在生成中..."
            : "输入您的回复..."
        }
      />
    </div>
  )
}

/* ── Scroll to bottom button ── */

function ScrollToBottom({
  scrollRef,
  isAtBottomRef,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>
  isAtBottomRef: React.RefObject<boolean>
}) {
  const [show, setShow] = useState(false)

  // Poll whether user has scrolled up
  useEffect(() => {
    const id = setInterval(() => {
      setShow(!isAtBottomRef.current)
    }, 200)
    return () => clearInterval(id)
  }, [isAtBottomRef])

  if (!show) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            isAtBottomRef.current = true
          }
        }}
        className={cn(
          "absolute bottom-2 left-1/2 -translate-x-1/2",
          "flex items-center gap-1 px-3 py-1.5",
          "text-xs font-medium rounded-full border border-border",
          "bg-card text-muted-foreground shadow-sm",
          "hover:bg-accent hover:text-foreground",
          "transition-[background,color,opacity] duration-200",
          "z-10"
        )}
      >
        <ArrowDown className="w-3 h-3" />
        回到底部
      </button>
    </div>
  )
}
