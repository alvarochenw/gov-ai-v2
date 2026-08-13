"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import {
  Upload,
  UserCheck,
  Sparkles,
  Send,
  ChevronDown,
  Check,
  Pin,
  Paperclip,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ContextChip } from "@/components/context-chip"
import type { AttachedFile } from "@/components/chat-input"
import { modes } from "@/data/modes"
import { experts } from "@/data/experts"
import type { ModeName } from "@/types"

const contextChips = [
  {
    label: "通用写作",
    example:
      "帮我起草一篇完整公文，标题是【输入标题】，字数【填写字数】字左右，写作要求是【请输入】。",
  },
  {
    label: "工作总结",
    example:
      "根据三个月月报起草工作总结，突出数据变化、重点成效和下一步计划",
  },
  {
    label: "会议纪要",
    example:
      "根据会议记录整理会议纪要，提取议定事项、责任单位和完成时限",
  },
  {
    label: "专项汇报",
    example:
      "围绕专项整治工作起草专项汇报，包括背景、进展、成效、问题和建议",
  },
]

interface ComposerProps {
  mode: ModeName
  expert: string
  defaultExpert: string
  pinnedExperts: string[]
  onSend: (prompt: string, file?: AttachedFile) => void
  onExpertChange: (name: string, prompt: string) => void
  initialPrompt?: string
  onPromptConsumed?: () => void
}

export function Composer({
  mode,
  expert,
  defaultExpert,
  pinnedExperts,
  onSend,
  onExpertChange,
  initialPrompt = "",
  onPromptConsumed,
}: ComposerProps) {
  const [promptText, setPromptText] = useState("")
  const [deepThinking, setDeepThinking] = useState(false)
  const [expertDropdownOpen, setExpertDropdownOpen] = useState(false)
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null)
  // Store position as ref so we can set it synchronously on click, no extra render
  const [dropdownPos, setDropdownPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentMode = modes.find((m) => m.name === mode)
  const placeholder = currentMode?.placeholder || "请输入写作要求"

  // Sync initialPrompt from parent (adjusting state based on props)
  const [consumedPrompt, setConsumedPrompt] = useState("")
  if (initialPrompt && initialPrompt !== consumedPrompt) {
    setConsumedPrompt(initialPrompt)
    setPromptText(initialPrompt)
  }

  // Side effects after initialPrompt is consumed
  useEffect(() => {
    if (initialPrompt) {
      onPromptConsumed?.()
      textareaRef.current?.focus()
    }
  }, [initialPrompt, onPromptConsumed])

  // Compute dropdown position from trigger button (synchronous, no setState)
  const calcPosition = useCallback((): { top?: number; bottom?: number; left: number; width: number } | null => {
    if (!triggerRef.current) return null
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 8
    const dropdownHeight = 280 // estimated max height
    const spaceAbove = rect.top

    // Only position above if there's enough room; otherwise go below
    const positionAbove = spaceAbove >= dropdownHeight
    return {
      ...(positionAbove
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
      left: rect.left,
      width: Math.max(rect.width, 320),
    }
  }, [])

  // Toggle dropdown — compute position synchronously before setting open state
  const toggleDropdown = useCallback(() => {
    setExpertDropdownOpen((prev) => {
      if (!prev) {
        // Opening: set position immediately so the first render has correct coordinates
        const pos = calcPosition()
        if (pos) setDropdownPos(pos)
      }
      return !prev
    })
  }, [calcPosition])

  // After dropdown mounts, scroll the selected expert into view
  useEffect(() => {
    if (!expertDropdownOpen || !listRef.current) return
    const selectedEl = listRef.current.querySelector('[data-expert-selected="true"]')
    if (selectedEl) {
      // Use { behavior: 'instant' } to avoid visible scroll animation / page jitter
      selectedEl.scrollIntoView({ block: "center", behavior: "instant" } as ScrollIntoViewOptions)
    }
  }, [expertDropdownOpen])

  // Close on outside click or Escape
  useEffect(() => {
    if (!expertDropdownOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return
      }
      setExpertDropdownOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpertDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [expertDropdownOpen])

  // Update position on scroll/resize while open
  useEffect(() => {
    if (!expertDropdownOpen) return
    const handler = () => {
      const pos = calcPosition()
      if (pos) setDropdownPos(pos)
    }
    window.addEventListener("scroll", handler, true)
    window.addEventListener("resize", handler)
    return () => {
      window.removeEventListener("scroll", handler, true)
      window.removeEventListener("resize", handler)
    }
  }, [expertDropdownOpen, calcPosition])

  const hasContent = promptText.trim().length > 0 || !!attachedFile

  const handleSend = () => {
    const value = promptText.trim()
    if (!value && !attachedFile) return
    onSend(value, attachedFile || undefined)
    setPromptText("")
    setAttachedFile(null)
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
    e.target.value = ""
  }

  const handleExpertSelect = (name: string, prompt: string) => {
    onExpertChange(name, prompt)
    setExpertDropdownOpen(false)
  }

  const currentExpert = experts.find((e) => e.name === expert)
  const ExpertIcon = currentExpert?.icon || UserCheck

  return (
    <>
      <div
        className={cn(
          "relative border border-[rgba(92,68,80,0.10)] rounded-[26px] overflow-hidden",
          "bg-white/92 backdrop-blur-[16px] shadow-[0_22px_60px_rgba(74,49,60,0.10)]",
          "before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[3px]",
          "before:bg-gradient-to-r before:from-transparent before:via-[rgba(200,60,78,0.55)] before:to-transparent"
        )}
      >
        <label className="sr-only" htmlFor="prompt">
          写作要求
        </label>
        <textarea
          ref={textareaRef}
          id="prompt"
          className="block w-full min-h-[158px] resize-y border-0 p-[25px_25px_18px] text-foreground bg-transparent leading-[1.8] text-[15px] focus:outline-none placeholder:text-[#aaa3ad]"
          placeholder={placeholder}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSend()
            }
          }}
        />

        {/* Context chips */}
        <div className="px-[22px] pb-[15px] flex items-center gap-[7px] flex-wrap">
          {contextChips.map((chip) => (
            <ContextChip
              key={chip.label}
              label={chip.label}
              onClick={() => {
                setPromptText(chip.example)
                textareaRef.current?.focus()
              }}
            />
          ))}
        </div>

        {/* Attached file indicator */}
        {attachedFile && (
          <div className="flex items-center gap-2 px-[22px] pb-[10px]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-soft text-accent-deep text-xs font-medium">
              <Paperclip className="w-3 h-3" />
              <span className="truncate max-w-[200px]">{attachedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div
          className={cn(
            "px-[14px] py-3 border-t border-line",
            "flex items-center justify-between gap-2.5 flex-wrap",
            "bg-[rgba(250,249,250,0.76)]"
          )}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".txt,.csv,.json,.md,.text"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "min-h-[39px] border border-line rounded-[12px] px-[13px] py-2 cursor-pointer",
                "bg-white/88 text-[12px] font-[680] inline-flex items-center gap-[7px]",
                "hover:border-[rgba(200,60,78,0.24)] hover:bg-accent-faint hover:shadow-[0_8px_20px_rgba(84,56,68,0.06)]",
                "transition-[background,border-color,box-shadow] duration-150",
                attachedFile && "border-[rgba(200,60,78,0.36)] bg-accent-faint"
              )}
            >
              <Upload className="w-[18px] h-[18px]" />
              {attachedFile ? "已添加" : "添加参考材料"}
            </button>

            {/* Expert trigger button */}
            <button
              ref={triggerRef}
              type="button"
              onClick={toggleDropdown}
              className={cn(
                "min-h-[39px] border rounded-[12px] px-[13px] py-2 cursor-pointer",
                "text-[12px] font-[680] inline-flex items-center gap-[7px]",
                "transition-[background,border-color,box-shadow] duration-150",
                expertDropdownOpen
                  ? "border-[rgba(200,60,78,0.36)] bg-accent-faint shadow-[0_0_0_3px_rgba(200,60,78,0.06)]"
                  : "border-line bg-white/88 hover:border-[rgba(200,60,78,0.24)] hover:bg-accent-faint hover:shadow-[0_8px_20px_rgba(84,56,68,0.06)]"
              )}
            >
              <ExpertIcon className="w-[18px] h-[18px] text-accent-deep" />
              专家：{expert}
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-subtle transition-transform duration-150",
                  expertDropdownOpen && "rotate-180"
                )}
              />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDeepThinking(!deepThinking)}
              aria-pressed={deepThinking}
              className={cn(
                "min-h-[39px] border border-line rounded-[12px] px-[13px] py-2 cursor-pointer",
                "bg-white/88 text-[12px] font-[680] inline-flex items-center gap-[7px]",
                "hover:border-[rgba(200,60,78,0.24)] hover:bg-accent-faint hover:shadow-[0_8px_20px_rgba(84,56,68,0.06)]",
                "transition-[background,border-color,box-shadow] duration-150"
              )}
            >
              <Sparkles className="w-[18px] h-[18px]" />
              {deepThinking ? "深度思考：已开启" : "深度思考"}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!hasContent}
              aria-label="开始任务"
              className={cn(
                "h-[39px] px-4 rounded-[12px] border cursor-pointer",
                "inline-flex items-center justify-center gap-2",
                "text-[12px] font-[680]",
                "transition-[background,box-shadow,opacity] duration-150",
                hasContent
                  ? "border-accent-deep bg-gradient-to-br from-[#cf4657] to-[#aa2639] text-white shadow-[0_10px_22px_rgba(170,38,57,0.18)] hover:from-[#c23b4d] hover:to-[#981f32]"
                  : "border-line bg-muted/50 text-muted-foreground/50 cursor-not-allowed shadow-none"
              )}
            >
              <Send className="w-4 h-4" />
              开始任务
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown portal — rendered at body level to escape overflow-hidden */}
      {expertDropdownOpen &&
        dropdownPos &&
        createPortal(
          <div
            ref={listRef}
            className={cn(
              "bg-white border border-line rounded-[18px]",
              "shadow-[0_22px_60px_rgba(74,49,60,0.14)]",
              "overflow-hidden"
            )}
            style={{
              position: "fixed",
              ...(dropdownPos.top != null ? { top: dropdownPos.top } : { bottom: dropdownPos.bottom }),
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
          >
            <div className="px-4 pt-3 pb-2 border-b border-line">
              <span className="text-[11px] font-[680] text-muted-text tracking-wider">
                选择数字专家
              </span>
            </div>
            <div className="max-h-[min(260px,40vh)] overflow-y-auto py-1">
              {/* Sort: default first, then pinned, then rest */}
              {[...experts].sort((a, b) => {
                const aPinned = pinnedExperts.includes(a.name)
                const bPinned = pinnedExperts.includes(b.name)
                const aDefault = a.name === defaultExpert
                const bDefault = b.name === defaultExpert
                if (aDefault) return -1
                if (bDefault) return 1
                if (aPinned && !bPinned) return -1
                if (!aPinned && bPinned) return 1
                return 0
              }).map((exp) => {
                const ExpIcon = exp.icon
                const isSelected = exp.name === expert
                const isDefault = exp.name === defaultExpert
                const isPinned = pinnedExperts.includes(exp.name)
                return (
                  <button
                    key={exp.name}
                    type="button"
                    data-expert-selected={isSelected || undefined}
                    onClick={() => handleExpertSelect(exp.name, exp.prompt)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer",
                      "transition-[background] duration-100",
                      isSelected
                        ? "bg-accent-soft text-accent-deep"
                        : "hover:bg-accent-faint text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 grid place-items-center rounded-lg flex-none",
                        isSelected
                          ? "bg-gradient-to-br from-[#d85061] to-[#aa2639] text-white"
                          : "bg-accent-soft text-accent-deep"
                      )}
                    >
                      <ExpIcon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[13px] font-[620] truncate">
                        {exp.name}
                      </span>
                      <span className="block text-[10px] text-muted-text">
                        {exp.specialty}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-none">
                      {isDefault && (
                        <span className="text-[9px] font-[660] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          默认
                        </span>
                      )}
                      {isPinned && !isDefault && (
                        <Pin className="w-3 h-3 text-primary/60" />
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-accent-deep" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
