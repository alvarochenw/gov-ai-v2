"use client"

import { useState } from "react"
import { LayoutGrid, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import type { WritingTemplate } from "@/data/template"
import { loadSavedTemplates } from "@/data/template"

/**
 * Pick a structure template from the template library (presets + user-saved).
 * Read-only: selecting only — no view/edit/copy/pin/delete (those live in 模板库).
 */
export function TemplatePickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (template: WritingTemplate) => void
}) {
  const [search, setSearch] = useState("")

  // read fresh from localStorage on each render (cheap; ensures newly created
  // templates in 模板库 appear without remount). Only meaningful when open.
  const templates = open ? loadSavedTemplates() : []
  const q = search.trim().toLowerCase()
  const filtered = q ? templates.filter((t) => t.name.toLowerCase().includes(q)) : templates

  const handleSelect = (t: WritingTemplate) => {
    onPick(t)
    onOpenChange(false)
    setSearch("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "block gap-0 p-0 overflow-hidden",
          "max-w-5xl w-[min(1100px,94vw)] max-h-[82vh] flex flex-col",
          "bg-background border border-line rounded-2xl"
        )}
      >
        {/* Header — title + close on the same row */}
        <div className="flex items-center justify-between px-6 h-14 flex-none border-b border-line">
          <DialogTitle className="text-base font-[680] text-foreground">
            选取模板
          </DialogTitle>
          <DialogClose
            className="w-8 h-8 -mr-2 grid place-items-center rounded-lg text-muted-text hover:text-accent-deep hover:bg-white/60 cursor-pointer transition-[color,background] duration-150"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">关闭</span>
          </DialogClose>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-line">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索模板名称..."
              className={cn(
                "w-full h-9 pl-9 pr-9 border border-line rounded-4xl text-sm",
                "bg-white/60 text-foreground placeholder:text-subtle",
                "focus:outline-none focus:border-[rgba(200,60,78,0.36)] focus:ring-2 focus:ring-[rgba(200,60,78,0.08)]",
                "transition-[border-color,box-shadow] duration-150"
              )}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 grid place-items-center text-muted-text hover:text-accent-deep cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-text text-sm">
              {templates.length === 0
                ? "暂无模板，请先到模板库创建"
                : "未找到匹配的模板"}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filtered.map((t) => {
                const isPreset = t.id.startsWith("preset-")
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelect(t)}
                    title={t.name}
                    className={cn(
                      "flex items-center gap-3 text-left w-full p-3.5 bg-white/84 border border-line rounded-xl",
                      "hover:border-accent-deep hover:shadow-md cursor-pointer",
                      "transition-[border-color,box-shadow] duration-150"
                    )}
                  >
                    <span className="w-8 h-8 rounded-lg bg-accent-faint text-accent-deep grid place-items-center flex-none">
                      <LayoutGrid className="w-4 h-4" />
                    </span>
                    <span
                      className="text-sm font-[680] text-foreground truncate flex-1 min-w-0"
                      title={t.name}
                    >
                      {t.name}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-[660] px-1.5 py-0.5 rounded flex-none",
                        isPreset ? "bg-primary/10 text-primary" : "bg-accent-soft text-accent-deep"
                      )}
                    >
                      {isPreset ? "预设" : t.source === "file" ? "文件提取" : "自定义"}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
