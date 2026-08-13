"use client"

import { useState, useRef } from "react"
import { Send, Paperclip, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AttachedFile {
  name: string
  content: string
}

interface ChatInputProps {
  onSend: (text: string, file?: AttachedFile) => void
  placeholder?: string
  disabled?: boolean
  /** Whether file upload is enabled for this chat mode */
  fileUploadEnabled?: boolean
}

export function ChatInput({ onSend, placeholder = "输入您的回复...", disabled, fileUploadEnabled = false }: ChatInputProps) {
  const [text, setText] = useState("")
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const value = text.trim()
    if (!value && !attachedFile) return
    onSend(value, attachedFile || undefined)
    setText("")
    setAttachedFile(null)
    textareaRef.current?.focus()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : ""
      setAttachedFile({ name: file.name, content })
    }
    reader.readAsText(file)

    // Reset the input so the same file can be re-selected
    e.target.value = ""
  }

  const removeFile = () => {
    setAttachedFile(null)
  }

  return (
    <div
      className={cn(
        "flex-none border-t border-line bg-white/78 backdrop-blur-[18px] px-6 py-4",
        "flex flex-col gap-2"
      )}
    >
      {/* Attached file indicator */}
      {attachedFile && (
        <div className="flex items-center gap-2 px-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-soft text-accent-deep text-xs font-medium">
            <Paperclip className="w-3 h-3" />
            <span className="truncate max-w-[200px]">{attachedFile.name}</span>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".txt,.csv,.json,.md,.text"
          onChange={handleFileChange}
        />

        {/* File upload button */}
        {fileUploadEnabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "w-10 h-10 grid place-items-center rounded-xl flex-none cursor-pointer",
              "border border-line bg-white/92 text-muted-foreground",
              "hover:border-[rgba(200,60,78,0.24)] hover:bg-accent-faint hover:text-accent-deep",
              "transition-[background,border-color,color] duration-150",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            title="上传数据文件"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        )}

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
          disabled={disabled || (!text.trim() && !attachedFile)}
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
    </div>
  )
}
