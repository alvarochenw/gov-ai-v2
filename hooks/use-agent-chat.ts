"use client"

import { useState, useCallback, useRef } from "react"
import type { ChatMessage, ToolCallInfo } from "@/types"

interface UseAgentChatOptions {
  initialGreeting?: ChatMessage
}

interface UseAgentChatReturn {
  messages: ChatMessage[]
  isStreaming: boolean
  sessionId: string | null
  sendMessage: (text: string, _file?: unknown) => void
  clearChat: () => void
}

const DOC_START = "<!-- 公文开始 -->"
const DOC_END = "<!-- 公文结束 -->"

/**
 * Parses an SSE stream from our /api/chat BFF proxy.
 * Splits content into multiple message bubbles at tool call boundaries,
 * and extracts document content marked with <!-- 公文开始 -->.
 */
export function useAgentChat(opts?: UseAgentChatOptions): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(
    opts?.initialGreeting ? [opts.initialGreeting] : [],
  )
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isStreamingRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)

  const initialGreeting = opts?.initialGreeting

  const updateStreaming = useCallback((val: boolean) => {
    isStreamingRef.current = val
    setIsStreaming(val)
  }, [])
  const updateSessionId = useCallback((val: string | null) => {
    sessionIdRef.current = val
    setSessionId(val)
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreamingRef.current) return

      // Add user message
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        type: "text",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])

      // First assistant segment
      const firstSegmentId = crypto.randomUUID()
      setMessages((prev) => [
        ...prev,
        {
          id: firstSegmentId,
          role: "assistant" as const,
          content: "",
          type: "text" as const,
          timestamp: Date.now(),
          thinking: "",
          toolCalls: [],
        },
      ])
      updateStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      // Segment tracking
      let activeSegmentId = firstSegmentId
      let segmentContent = ""          // content for current active segment
      let thinkingAccumulated = ""      // thinking always goes to first segment
      const toolCallsMap = new Map<string, ToolCallInfo>()
      let hadCompletedToolCall = false   // flag to create new segment on next content
      let docMessageId: string | null = null

      // Helper: flush current segment content to state
      const flushSegment = () => {
        if (docMessageId) {
          // Document mode — append to document
          const fullDoc = segmentContent
          const endIdx = fullDoc.indexOf(DOC_END)
          const docText = endIdx >= 0 ? fullDoc.slice(0, endIdx).trim() : fullDoc.trim()
          setMessages((prev) =>
            prev.map((m) =>
              m.id === docMessageId ? { ...m, content: docText } : m,
            ),
          )
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === activeSegmentId
                ? { ...m, content: segmentContent }
                : m,
            ),
          )
        }
      }

      try {
        const currentSessionId = sessionIdRef.current
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            session_id: currentSessionId || undefined,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          let errText = `请求失败 (${res.status})`
          try {
            const errBody = await res.json()
            if (errBody.error) errText = errBody.error
          } catch { /* ignore */ }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === activeSegmentId ? { ...m, content: `❌ ${errText}` } : m,
            ),
          )
          updateStreaming(false)
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === activeSegmentId ? { ...m, content: "❌ 无法读取响应流" } : m,
            ),
          )
          updateStreaming(false)
          return
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split("\n")
          buffer = parts.pop() ?? ""

          for (const line of parts) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith(":")) continue
            if (!trimmed.startsWith("data:")) continue

            const jsonStr = trimmed.slice(5).trim()
            if (!jsonStr) continue

            try {
              const data = JSON.parse(jsonStr)

              if (data.session_id && !sessionIdRef.current) {
                updateSessionId(data.session_id)
              }

              // ── RunContent ──
              if (data.event === "RunContent") {
                if (typeof data.content === "string") {

                  // If we had a completed tool call, start a new segment
                  if (hadCompletedToolCall && segmentContent.trim()) {
                    // Finalize current segment first
                    flushSegment()

                    // Create new segment
                    const newId = crypto.randomUUID()
                    const newMsg: ChatMessage = {
                      id: newId,
                      role: "assistant",
                      content: "",
                      type: "text",
                      timestamp: Date.now(),
                    }
                    setMessages((prev) => [...prev, newMsg])
                    activeSegmentId = newId
                    segmentContent = ""
                    hadCompletedToolCall = false
                    docMessageId = null
                  }
                  hadCompletedToolCall = false

                  segmentContent += data.content

                  // Check for document marker
                  if (!docMessageId && segmentContent.includes(DOC_START)) {
                    const splitIdx = segmentContent.indexOf(DOC_START)
                    const introText = segmentContent.slice(0, splitIdx).trim()
                    const docContent = segmentContent.slice(splitIdx + DOC_START.length).trim()

                    const newDocId = crypto.randomUUID()
                    docMessageId = newDocId
                    segmentContent = docContent

                    // Update current segment to intro text
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === activeSegmentId
                          ? { ...m, content: introText }
                          : m,
                      ).concat({
                        id: newDocId,
                        role: "assistant" as const,
                        content: docContent,
                        type: "document" as const,
                        timestamp: Date.now(),
                      }),
                    )
                  } else {
                    flushSegment()
                  }
                }

                // Thinking content — always goes to first segment
                if (typeof data.reasoning_content === "string" && data.reasoning_content) {
                  thinkingAccumulated += data.reasoning_content
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === firstSegmentId
                        ? { ...m, thinking: thinkingAccumulated || undefined }
                        : m,
                    ),
                  )
                }
              }

              // ── ToolCallStarted ──
              if (data.event === "ToolCallStarted" && data.tool) {
                const tc = data.tool
                toolCallsMap.set(tc.tool_call_id, {
                  id: tc.tool_call_id,
                  toolName: tc.tool_name || "unknown",
                  toolArgs: typeof tc.tool_args === "string"
                    ? tc.tool_args
                    : JSON.stringify(tc.tool_args || {}),
                  status: "running",
                })
                const toolCallsSnapshot = Array.from(toolCallsMap.values())
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === activeSegmentId
                      ? { ...m, toolCalls: toolCallsSnapshot }
                      : m,
                  ),
                )
              }

              // ── ToolCallCompleted ──
              if (data.event === "ToolCallCompleted" && data.tool) {
                const tc = data.tool
                const existing = toolCallsMap.get(tc.tool_call_id)
                toolCallsMap.set(tc.tool_call_id, {
                  id: tc.tool_call_id,
                  toolName: tc.tool_name || existing?.toolName || "unknown",
                  toolArgs: typeof tc.tool_args === "string"
                    ? tc.tool_args
                    : JSON.stringify(tc.tool_args || existing?.toolArgs || {}),
                  status: tc.tool_call_error ? "error" : "completed",
                  result: typeof tc.result === "string"
                    ? tc.result.slice(0, 200)
                    : undefined,
                })
                const toolCallsSnapshot = Array.from(toolCallsMap.values())
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === activeSegmentId
                      ? { ...m, toolCalls: toolCallsSnapshot }
                      : m,
                  ),
                )
                // Mark that next content should go to a new segment
                hadCompletedToolCall = true
              }

              // ── RunCompleted ──
              if (data.event === "RunCompleted") {
                if (data.session_id && !sessionIdRef.current) {
                  updateSessionId(data.session_id)
                }
              }

              // ── RunError ──
              if (data.event === "RunError") {
                const errMsg = typeof data.content === "string" ? data.content : "Agent 运行出错"
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === activeSegmentId ? { ...m, content: `❌ ${errMsg}` } : m,
                  ),
                )
              }
            } catch {
              // Non-JSON data line, skip
            }
          }
        }

        // Final cleanup
        if (!segmentContent && !docMessageId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === activeSegmentId ? { ...m, content: "（未收到回复内容）" } : m,
            ),
          )
        } else if (docMessageId) {
          // Strip end marker from document
          const endIdx = segmentContent.indexOf(DOC_END)
          const finalDoc = (endIdx >= 0 ? segmentContent.slice(0, endIdx) : segmentContent).trim()
          setMessages((prev) =>
            prev.map((m) =>
              m.id === docMessageId ? { ...m, content: finalDoc } : m,
            ),
          )
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        console.error("[useAgentChat] error:", err)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === activeSegmentId
              ? { ...m, content: "❌ 网络连接异常，请稍后重试" }
              : m,
          ),
        )
      } finally {
        updateStreaming(false)
        abortRef.current = null
      }
    },
    [updateStreaming, updateSessionId],
  )

  const clearChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages(initialGreeting ? [initialGreeting] : [])
    updateSessionId(null)
    updateStreaming(false)
  }, [initialGreeting, updateStreaming, updateSessionId])

  return { messages, isStreaming, sessionId, sendMessage, clearChat }
}
