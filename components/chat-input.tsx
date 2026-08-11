"use client"

import { useState, useRef } from "react"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (text: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ChatInput({ onSend, placeholder = "输入您的回复...", disabled }: ChatInputProps) {
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText("")
    textareaRef.current?.focus()
  }

  return (
    <div
      className={cn(
        "flex-none border-t border-line bg-white/78 backdrop-blur-[18px] px-6 py-4",
        "flex items-end gap-3"
      )}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleSend()
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none border border-line rounded-xl px-4 py-2.5 text-sm",
          "bg-white/92 text-foreground placeholder:text-[#aaa3ad]",
          "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:shadow-[0_0_0_3px_rgba(200,60,78,0.06)]",
          "transition-[border-color,box-shadow] duration-150",
          "min-h-[42px] max-h-[120px]"
        )}
        style={{ height: "auto" }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement
          target.style.height = "auto"
          target.style.height = Math.min(target.scrollHeight, 120) + "px"
        }}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className={cn(
          "w-10 h-10 grid place-items-center rounded-xl flex-none cursor-pointer",
          "bg-gradient-to-br from-[#cf4657] to-[#aa2639] text-white",
          "shadow-[0_6px_16px_rgba(170,38,57,0.18)]",
          "hover:from-[#c23b4d] hover:to-[#981f32]",
          "transition-[background,box-shadow,opacity] duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
        aria-label="发送"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}
