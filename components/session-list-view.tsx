"use client"

import { useState } from "react"
import { MessageSquare, Trash2, Search, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppState, useAppDispatch } from "@/hooks/use-app-state"
import type { ChatSession } from "@/types"

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "刚刚"
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay < 7) return `${diffDay} 天前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function SessionCard({
  session,
  onOpen,
  onDelete,
}: {
  session: ChatSession
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer",
        "bg-white hover:bg-[#faf8f7]",
        "transition-[background,shadow,transform] duration-150 active:translate-y-[0.5px]",
        "border border-[#f0e8e3]"
      )}
      onClick={onOpen}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-9 h-9 grid place-items-center rounded-lg flex-none",
          "bg-[#fce8ef] text-[#c2384a]"
        )}
      >
        <MessageSquare className="w-4 h-4" />
      </div>

      {/* Title + Expert */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[#2c1810] truncate">
          {session.title}
        </h3>
        <span className="text-xs text-[#8b7b6e]">
          {session.expert}
        </span>
      </div>

      {/* Time */}
      <span className="text-xs text-[#a89b90] flex-none whitespace-nowrap">
        {formatTime(session.updatedAt)}
      </span>

      {/* Delete */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className={cn(
          "p-1.5 rounded-lg border-0 bg-transparent cursor-pointer",
          "text-[#c4b5aa] hover:text-[#c2384a] hover:bg-[#c2384a]/8",
          "opacity-0 group-hover:opacity-100 transition-[opacity,color,background] duration-150 flex-none"
        )}
        title="删除会话"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function SessionListView() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { sessions } = state

  const [searchQuery, setSearchQuery] = useState("")
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "custom">("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const handleOpen = (session: ChatSession) => {
    dispatch({ type: "CLEAR_CHAT" })
    for (const msg of session.messages) {
      dispatch({ type: "ADD_MESSAGE", message: msg })
    }
    dispatch({ type: "SET_ACTIVE_SESSION", id: session.id })
    dispatch({ type: "SET_EXPERT", expert: session.expert })
    dispatch({ type: "SET_CHAT_MODE", mode: session.mode })
    dispatch({ type: "SET_VIEW", view: "chat" })
  }

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_SESSION", id })
  }

  const [now] = useState(Date.now)
  const filteredSessions = sessions.filter((s) => {
    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!s.title.toLowerCase().includes(q) && !s.expert.toLowerCase().includes(q)) {
        return false
      }
    }
    // Time filter
    if (timeFilter === "today") {
      const diffMs = now - s.updatedAt
      if (diffMs > 86400000) return false
    } else if (timeFilter === "week") {
      const diffMs = now - s.updatedAt
      if (diffMs > 604800000) return false
    } else if (timeFilter === "custom") {
      if (dateFrom) {
        const from = new Date(dateFrom).getTime()
        if (s.updatedAt < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo).getTime() + 86400000 // end of day
        if (s.updatedAt > to) return false
      }
    }
    return true
  })

  const timeOptions: { value: typeof timeFilter; label: string }[] = [
    { value: "all", label: "全部" },
    { value: "today", label: "今天" },
    { value: "week", label: "近7天" },
  ]

  return (
    <section className="w-[min(820px,100%)] mx-auto">
      <div className="mb-6">
        <h1 className="m-0 text-[27px] tracking-[-0.03em]">会话列表</h1>
        <p className="m-0 mt-2 text-muted-text leading-relaxed text-[13px]">
          查看和继续所有对话记录，点击即可恢复上次会话。
        </p>
      </div>

      {/* Search + time filter toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative w-[min(360px,100%)]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-subtle pointer-events-none" />
          <input
            className="min-h-[42px] w-full border border-line rounded-[12px] px-3 py-2 pl-[39px] text-foreground bg-white/88 text-sm placeholder:text-subtle focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)] transition-[border-color,box-shadow] duration-150"
            type="search"
            placeholder="搜索会话标题或专家"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {timeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setTimeFilter(opt.value)
                if (opt.value !== "custom") {
                  setDateFrom("")
                  setDateTo("")
                }
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-[620] cursor-pointer border transition-[background,color,border-color] duration-150",
                timeFilter === opt.value
                  ? "bg-accent-soft text-accent-deep border-[rgba(200,60,78,0.24)]"
                  : "bg-transparent text-muted-text border-transparent hover:bg-white/60"
              )}
            >
              {opt.label}
            </button>
          ))}
          {/* Date range picker */}
          <span className="text-line mx-1">|</span>
          <span className="relative flex items-center">
            <Calendar className="absolute left-2.5 w-3.5 h-3.5 text-subtle pointer-events-none" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                if (e.target.value || dateTo) setTimeFilter("custom")
              }}
              className={cn(
                "h-[32px] border rounded-lg pl-7 pr-2 text-xs text-foreground bg-white/88",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)]",
                "transition-[border-color] duration-150",
                timeFilter === "custom" && dateFrom ? "border-[rgba(200,60,78,0.36)]" : "border-line"
              )}
            />
          </span>
          <span className="text-muted-text text-xs">至</span>
          <span className="relative flex items-center">
            <Calendar className="absolute left-2.5 w-3.5 h-3.5 text-subtle pointer-events-none" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                if (dateFrom || e.target.value) setTimeFilter("custom")
              }}
              className={cn(
                "h-[32px] border rounded-lg pl-7 pr-2 text-xs text-foreground bg-white/88",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)]",
                "transition-[border-color] duration-150",
                timeFilter === "custom" && dateTo ? "border-[rgba(200,60,78,0.36)]" : "border-line"
              )}
            />
          </span>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 grid place-items-center rounded-2xl bg-[#f5ede8] mb-4">
            <MessageSquare className="w-7 h-7 text-[#c4b5aa]" />
          </div>
          <p className="text-sm text-[#8b7b6e]">
            {sessions.length === 0 ? "暂无会话记录" : "没有匹配的会话"}
          </p>
          <p className="text-xs text-[#a89b90] mt-1">
            {sessions.length === 0 ? "在首页输入需求开始新对话" : "尝试调整搜索条件"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onOpen={() => handleOpen(session)}
              onDelete={() => handleDelete(session.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
