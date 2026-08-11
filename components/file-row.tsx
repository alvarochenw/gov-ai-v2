"use client"

import {
  FileText,
  BarChart3,
  ShieldCheck,
  LayoutGrid,
  Folder,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { KnowledgeFile } from "@/types"

const categoryIcons: Record<string, LucideIcon> = {
  公文: FileText,
  报告: BarChart3,
  制度: ShieldCheck,
  模板: LayoutGrid,
  文件夹: Folder,
}

interface FileRowProps {
  file: KnowledgeFile
}

export function FileRow({ file }: FileRowProps) {
  const Icon = categoryIcons[file.category ?? ""] || FileText

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_150px_120px] max-[800px]:grid-cols-1 max-[800px]:gap-[7px] gap-4 items-center px-[18px] py-4 border-b border-line last:border-b-0 hover:bg-accent-faint transition-colors">
      <div className="min-w-0 flex items-center gap-3">
        <span className="w-[39px] h-[39px] flex-none grid place-items-center text-accent-deep bg-accent-soft rounded-[12px]">
          <Icon className="w-5 h-5" />
        </span>
        <span className="overflow-hidden whitespace-nowrap text-ellipsis text-[13px] font-[620]">
          {file.name}
        </span>
      </div>
      <span className="text-muted-text text-[11px] max-[800px]:pl-[51px]">
        {file.department}
      </span>
      <span className="text-muted-text text-[11px] max-[800px]:pl-[51px]">
        {file.date}
      </span>
    </div>
  )
}
