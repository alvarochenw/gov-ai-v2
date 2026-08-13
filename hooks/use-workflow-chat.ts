"use client"

import { useState, useCallback, useRef } from "react"
import type { ChatMessage, ToolCallInfo } from "@/types"
import type { AttachedFile } from "@/components/chat-input"

interface UseWorkflowChatOptions {
  appId: string
  initialGreeting?: ChatMessage
}

interface UseWorkflowChatReturn {
  messages: ChatMessage[]
  isStreaming: boolean
  executionId: string | null
  sendMessage: (text: string, file?: AttachedFile) => void
  clearChat: () => void
}

/**
 * Parses an SSE stream from the /api/chat/workflow BFF proxy.
 *
 * Workflow API SSE events:
 *   workflow:start  → capture execution_id
 *   node:start      → map to ToolCallInfo (status=running)
 *   node:end        → update ToolCallInfo (status=completed/error)
 *   RunContent      → append content / reasoning_content (same format as Agent API)
 *   workflow:end    → stream complete
 *   error           → display error
 */
export function useWorkflowChat(opts: UseWorkflowChatOptions): UseWorkflowChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(
    opts?.initialGreeting ? [opts.initialGreeting] : [],
  )
  const [isStreaming, setIsStreaming] = useState(false)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isStreamingRef = useRef(false)
  const appIdRef = useRef(opts.appId)

  const updateStreaming = useCallback((val: boolean) => {
    isStreamingRef.current = val
    setIsStreaming(val)
  }, [])

  const sendMessage = useCallback(
    async (text: string, file?: AttachedFile) => {
      if ((!text.trim() && !file) || isStreamingRef.current) return

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
      let hadCompletedNode = false      // flag to create new segment on next content

      // Helper: flush current segment content to state
      const flushSegment = () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === activeSegmentId
              ? { ...m, content: segmentContent }
              : m,
          ),
        )
      }

      try {
        const res = await fetch("/api/chat/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            app_id: appIdRef.current,
            document: file?.content,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          let errText = `请求失败 (${res.status})`
          try {
            const errBody = await res.json()
            if (errBody.error) errText = errBody.error
            if (errBody.detail) errText += ` — ${typeof errBody.detail === "string" ? errBody.detail : JSON.stringify(errBody.detail)}`
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
        let currentEventName = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split("\n")
          buffer = parts.pop() ?? ""

          for (const line of parts) {
            const trimmed = line.trim()

            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith(":")) continue

            // Parse SSE event name
            if (trimmed.startsWith("event:")) {
              currentEventName = trimmed.slice(6).trim()
              continue
            }

            // Parse SSE data
            if (!trimmed.startsWith("data:")) continue

            const jsonStr = trimmed.slice(5).trim()
            if (!jsonStr) continue

            try {
              const data = JSON.parse(jsonStr)

              // Debug: log key events to console for troubleshooting
              if (["workflow:start", "node:start", "node:end", "workflow:end", "error"].includes(currentEventName)) {
                console.log(`[workflow] event=${currentEventName}`, JSON.stringify(data).slice(0, 200))
              }

              // ── workflow:start ──
              if (currentEventName === "workflow:start") {
                if (data.execution_id) {
                  setExecutionId(data.execution_id)
                }
              }

              // ── RunContent (stream_output=true) ──
              if (currentEventName === "RunContent") {
                if (typeof data.content === "string") {
                  // If we had a completed node, start a new segment
                  if (hadCompletedNode && segmentContent.trim()) {
                    flushSegment()

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
                    hadCompletedNode = false
                  }
                  hadCompletedNode = false

                  segmentContent += data.content
                  flushSegment()
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

              // ── node:start ── map to ToolCallInfo (running)
              if (currentEventName === "node:start" && data.node_id) {
                const nodeId = data.node_id
                // Use human-readable name if available (data.name/data.label), fallback to node_id
                const displayName = data.name || data.label || data.node_name || nodeId
                const tcId = `node-${nodeId}-${Date.now()}`
                toolCallsMap.set(nodeId, {
                  id: tcId,
                  toolName: displayName,
                  toolArgs: "",
                  status: "running",
                })
                // Tool calls always go to the first segment (same as thinking)
                const toolCallsSnapshot = Array.from(toolCallsMap.values())
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === firstSegmentId
                      ? { ...m, toolCalls: toolCallsSnapshot }
                      : m,
                  ),
                )
              }

              // ── node:end ── update ToolCallInfo
              if (currentEventName === "node:end" && data.node_id) {
                const nodeId = data.node_id
                const existing = toolCallsMap.get(nodeId)
                if (existing) {
                  // Treat SUCCESS / COMPLETED / PASSTHROUGH as completed; only ERROR as error
                  const isOk = data.status === "SUCCESS" || data.status === "COMPLETED" || data.status === "PASSTHROUGH"
                  toolCallsMap.set(nodeId, {
                    ...existing,
                    status: isOk ? "completed" : "error",
                    result: data.output
                      ? (typeof data.output === "string"
                          ? data.output.slice(0, 200)
                          : JSON.stringify(data.output).slice(0, 200))
                      : undefined,
                  })
                  // Tool calls always go to the first segment
                  const toolCallsSnapshot = Array.from(toolCallsMap.values())
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === firstSegmentId
                        ? { ...m, toolCalls: toolCallsSnapshot }
                        : m,
                    ),
                  )
                }
                // Mark that next content should go to a new segment
                hadCompletedNode = true
              }

              // ── workflow:end ── finalize all still-running tool calls
              if (currentEventName === "workflow:end") {
                // Mark any tool calls still in "running" as completed
                let needsUpdate = false
                for (const [nodeId, tc] of toolCallsMap) {
                  if (tc.status === "running") {
                    toolCallsMap.set(nodeId, { ...tc, status: "completed" })
                    needsUpdate = true
                  }
                }
                if (needsUpdate) {
                  const toolCallsSnapshot = Array.from(toolCallsMap.values())
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === firstSegmentId
                        ? { ...m, toolCalls: toolCallsSnapshot }
                        : m,
                    ),
                  )
                }

                // If there's output in workflow:end, append it as content
                if (data.outputs) {
                  const outputText = typeof data.outputs === "string"
                    ? data.outputs
                    : (data.outputs.text || data.outputs.output || "")
                  if (outputText && typeof outputText === "string") {
                    segmentContent += outputText
                    flushSegment()
                  }
                }
              }

              // ── error ──
              if (currentEventName === "error") {
                const errMsg = typeof data.message === "string"
                  ? data.message
                  : typeof data.error === "string"
                    ? data.error
                    : "Workflow 运行出错"
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

        // Final cleanup — mark any still-running tool calls as completed
        let needsFinalCleanup = false
        for (const [nodeId, tc] of toolCallsMap) {
          if (tc.status === "running") {
            toolCallsMap.set(nodeId, { ...tc, status: "completed" })
            needsFinalCleanup = true
          }
        }
        if (needsFinalCleanup) {
          const toolCallsSnapshot = Array.from(toolCallsMap.values())
          setMessages((prev) =>
            prev.map((m) =>
              m.id === firstSegmentId
                ? { ...m, toolCalls: toolCallsSnapshot }
                : m,
            ),
          )
        }

        if (!segmentContent) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === activeSegmentId ? { ...m, content: "（未收到回复内容）" } : m,
            ),
          )
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return
        console.error("[useWorkflowChat] error:", err)
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
    [updateStreaming],
  )

  const clearChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages(opts?.initialGreeting ? [opts.initialGreeting] : [])
    setExecutionId(null)
    updateStreaming(false)
  }, [opts?.initialGreeting, updateStreaming])

  return { messages, isStreaming, executionId, sendMessage, clearChat }
}
