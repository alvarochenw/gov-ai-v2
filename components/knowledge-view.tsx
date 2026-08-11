"use client"

import { useState } from "react"
import { Folder, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppState, useAppDispatch } from "@/hooks/use-app-state"
import { FileRow } from "@/components/file-row"

export function KnowledgeView() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { notice } = state
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFiles = state.files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <section className="w-[min(1120px,100%)] mx-auto">
      <div className="mb-[22px] flex items-end justify-between gap-[18px]">
        <div>
          <h1 className="m-0 text-[27px] tracking-[-0.03em]">知识库</h1>
          <p className="m-0 mt-2 text-muted-text leading-relaxed text-[13px]">
            集中管理公文、制度、报告和常用模板，为智能写作提供可信参考。
          </p>
        </div>
      </div>
      <div className="flex gap-2.5 items-center justify-between mb-3.5 flex-wrap">
        <div className="relative w-[min(360px,100%)]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-subtle pointer-events-none" />
          <input
            className="min-h-[42px] w-full border border-line rounded-[12px] px-3 py-2 pl-[39px] text-foreground bg-white/88"
            type="search"
            placeholder="搜索文件名称"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            dispatch({
              type: "ADD_FILE",
              file: {
                name: "未命名文件夹",
                type: "folder",
                size: "—",
                addedAt: "刚刚",
                category: "文件夹",
                department: "我",
                date: "刚刚",
              },
            })
            dispatch({ type: "SET_NOTICE", notice: "已新建文件夹。" })
          }}
          className={cn(
            "min-h-[39px] border border-accent-deep rounded-[12px] px-[13px] py-2 cursor-pointer",
            "bg-gradient-to-br from-[#cf4657] to-[#aa2639] text-white font-[680]",
            "shadow-[0_10px_22px_rgba(170,38,57,0.18)] text-[12px]",
            "inline-flex items-center gap-[7px] hover:from-[#c23b4d] hover:to-[#981f32]",
            "transition-[background,box-shadow] duration-150"
          )}
        >
          <Folder className="w-[18px] h-[18px]" />
          新建文件夹
        </button>
      </div>
      <div className="bg-white/86 border border-line rounded-[18px] overflow-hidden shadow-[0_8px_24px_rgba(74,49,60,0.06)]">
        {filteredFiles.length === 0 ? (
          <div className="px-[18px] py-4 text-muted-text text-[11px]">
            没有匹配的文件
          </div>
        ) : (
          filteredFiles.map((file, i) => (
            <FileRow key={file.name + i} file={file} />
          ))
        )}
      </div>
      {notice && (
        <p
          className="min-h-[22px] mt-3 mx-[2px] text-accent-deep text-xs"
          role="status"
        >
          {notice}
        </p>
      )}
    </section>
  )
}
