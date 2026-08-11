"use client"

import { useMemo } from "react"
import { ArrowLeft, Download, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch } from "@/hooks/use-app-state"
import { mockProofreadResult, type ProofreadErrorType } from "@/data/proofread"
import { consumeProofreadInput } from "@/lib/proofread-data"

const errorTypeColors: Record<ProofreadErrorType, { bg: string; tag: string; text: string }> = {
  错别字: { bg: "bg-red-100", tag: "bg-red-200 text-red-800", text: "text-red-900" },
  语病: { bg: "bg-orange-100", tag: "bg-orange-200 text-orange-800", text: "text-orange-900" },
  称谓: { bg: "bg-blue-100", tag: "bg-blue-200 text-blue-800", text: "text-blue-900" },
  数字: { bg: "bg-purple-100", tag: "bg-purple-200 text-purple-800", text: "text-purple-900" },
  标点: { bg: "bg-teal-100", tag: "bg-teal-200 text-teal-800", text: "text-teal-900" },
  层级: { bg: "bg-gray-100", tag: "bg-gray-200 text-gray-700", text: "text-gray-800" },
}

/** Build annotated segments from text + sorted errors */
function buildSegments(
  text: string,
  errors: { position: number; length: number; type: ProofreadErrorType; label: string }[]
) {
  const sorted = [...errors].sort((a, b) => a.position - b.position)
  const segments: { text: string; isError: boolean; type?: ProofreadErrorType; label?: string }[] = []
  let cursor = 0

  for (const err of sorted) {
    if (err.position > cursor) {
      segments.push({ text: text.slice(cursor, err.position), isError: false })
    }
    segments.push({
      text: text.slice(err.position, err.position + err.length),
      isError: true,
      type: err.type,
      label: err.label,
    })
    cursor = err.position + err.length
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isError: false })
  }
  return segments
}

export function ProofreadEditorView() {
  const dispatch = useAppDispatch()
  const result = mockProofreadResult

  // Consume input data (to know source context, though we show mock data)
  consumeProofreadInput()

  // Error type summary
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of result.errors) {
      map[e.type] = (map[e.type] || 0) + 1
    }
    return Object.entries(map)
  }, [result.errors])

  // Build annotated original segments
  const originalSegments = useMemo(() => {
    const annotations = result.errors.map((e) => ({
      position: e.position,
      length: e.original.length,
      type: e.type,
      label: e.type,
    }))
    return buildSegments(result.originalText, annotations)
  }, [result])

  // Build annotated corrected segments — find corrected text positions
  const correctedSegments = useMemo(() => {
    // For each error, find where the corrected text appears in correctedText
    // We'll use a simple approach: track position by walking through errors sorted by original position
    const annotations: { position: number; length: number; type: ProofreadErrorType; label: string }[] = []
    let offset = 0
    const sortedErrors = [...result.errors].sort((a, b) => a.position - b.position)

    for (const err of sortedErrors) {
      // The corrected text position = original position + accumulated offset from previous corrections
      const correctedPos = err.position + offset
      const correctedLen = err.corrected.length
      annotations.push({
        position: correctedPos,
        length: correctedLen,
        type: err.type,
        label: "修改",
      })
      offset += err.corrected.length - err.original.length
    }

    return buildSegments(result.correctedText, annotations)
  }, [result])

  const renderSegments = (
    segments: { text: string; isError: boolean; type?: ProofreadErrorType; label?: string }[]
  ) =>
    segments.map((seg, i) => {
      if (!seg.isError) {
        return (
          <span key={i} style={{ whiteSpace: "pre-wrap" }}>
            {seg.text}
          </span>
        )
      }
      const colors = errorTypeColors[seg.type!]
      return (
        <mark
          key={i}
          className={cn("px-0.5 rounded", colors.bg, colors.text)}
        >
          {seg.text}
          <span
            className={cn(
              "ml-1 text-[10px] px-1 py-0.5 rounded align-middle",
              colors.tag
            )}
          >
            {seg.label}
          </span>
        </mark>
      )
    })

  return (
    <div className="w-[min(1120px,100%)] mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_VIEW", view: "tool-proofread" })}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl",
            "border border-line bg-white cursor-pointer text-muted-text text-sm",
            "hover:text-foreground hover:border-[rgba(200,60,78,0.24)]",
            "transition-[color,border-color] duration-150"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          返回智能校对
        </button>
        <h1 className="text-xl font-[760] tracking-[-0.03em]">智能校对结果</h1>
      </div>

      {/* Error summary strip */}
      <div className="flex items-center gap-3 flex-wrap mb-4 p-4 bg-accent-soft rounded-xl">
        <span className="text-accent-deep font-[680] text-sm">
          发现 {result.errorCount} 处问题
        </span>
        {typeCounts.map(([type, count]) => (
          <span
            key={type}
            className={cn(
              "text-[11px] font-[640] px-2 py-0.5 rounded-full",
              errorTypeColors[type as ProofreadErrorType].tag
            )}
          >
            {type} {count}
          </span>
        ))}
      </div>

      {/* Two-column comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left panel — Original */}
        <div className="bg-white/80 border border-line rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-line text-sm font-[660] text-muted-text">
            原文
          </div>
          <div className="p-5 text-sm leading-[1.8] text-foreground">
            {renderSegments(originalSegments)}
          </div>
        </div>

        {/* Right panel — Corrected */}
        <div className="bg-white/80 border border-line rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-line text-sm font-[660] text-muted-text">
            校对结果
          </div>
          <div className="p-5 text-sm leading-[1.8] text-foreground">
            {renderSegments(correctedSegments)}
          </div>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/92 border border-line rounded-2xl">
        <span className="text-accent-deep font-[680] text-sm">
          发现 {result.errorCount} 处问题
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_VIEW", view: "tool-proofread" })}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl",
              "border border-line bg-white cursor-pointer text-foreground text-sm font-[620]",
              "hover:bg-white/60 transition-[background] duration-150"
            )}
          >
            <RotateCcw className="w-4 h-4" />
            重新校对
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl",
              "border border-accent-deep bg-gradient-to-br from-[#cf4657] to-[#aa2639]",
              "text-white text-sm font-[620] cursor-pointer",
              "shadow-[0_6px_16px_rgba(170,38,57,0.14)]",
              "hover:from-[#c23b4d] hover:to-[#981f32]",
              "transition-[background,box-shadow] duration-150"
            )}
          >
            <Download className="w-4 h-4" />
            导出结果
          </button>
        </div>
      </div>
    </div>
  )
}
