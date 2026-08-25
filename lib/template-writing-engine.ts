/**
 * Template writing engine — section-by-section document generation.
 *
 * Current implementation is a MOCK (matches the project's "AI 全 mock" status).
 * The function signatures are designed to be swapped for real Workflow calls
 * later without changing the UI: replace `generateSection` with a streaming
 * POST /api/chat/workflow (app_id = TEMPLATE_WRITING_WORKFLOW_APP_ID) and keep
 * the same ctx contract (see docs/模板库AI功能实现逻辑.md for the target input).
 */

import type { TemplateSection } from "@/data/template"
import { parsePlaceholders } from "@/lib/placeholder"

/** Context shared across all section generations for one document. */
export interface GenerationContext {
  documentTitle: string
  draftingUnit: string
  additionalNotes: string
  placeholderValues?: Record<string, string>
  /** Flattened reference file names across level-1 sections (for display/prompts). */
  referenceFileNames: string[]
}

/** Status of a single section's generation lifecycle. */
export type SectionStatus = "pending" | "generating" | "done"

export interface SectionResult {
  sectionId: string
  title: string
  level: 1 | 2
  content: string
  status: SectionStatus
}

/** Group flat sections into [parent, ...children] arrays (read-only display). */
export function toGroups(sections: TemplateSection[]): TemplateSection[][] {
  const groups: TemplateSection[][] = []
  let current: TemplateSection[] = []
  for (const s of sections) {
    if (s.level === 1) {
      if (current.length) groups.push(current)
      current = [s]
    } else if (current.length) {
      current.push(s)
    }
  }
  if (current.length) groups.push(current)
  return groups
}

/** Replace {{placeholder}} tokens with user-supplied values; unfilled → 【待补:字段名】. */
function applyPlaceholders(text: string, values?: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, name: string) => {
    const key = name.trim()
    const val = values?.[key]
    return val && val.trim() ? val.trim() : `【待补:${key}】`
  })
}

/**
 * MOCK: generate the body text for one section.
 *
 * - prompt mode → derive from `generationHint` + ctx.notes/title, padded to word range.
 * - fill mode   → apply placeholder values to `fillTemplate`.
 *
 * TODO(workflow): replace with streaming Workflow call. The adapter should:
 *   POST /api/chat/workflow { app_id, inputs: { section, ctx } }
 *   and stream RunContent events back as incremental text.
 */
export async function generateSection(
  section: TemplateSection,
  ctx: GenerationContext,
): Promise<string> {
  // Simulate network/streaming latency
  await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 400))

  const base =
    section.writingMode === "fill"
      ? applyPlaceholders(section.fillTemplate, ctx.placeholderValues)
      : buildPromptMock(section, ctx)

  // Pad/trim toward the declared word range so the mock respects constraints.
  return constrainWordCount(base, section.wordCountMin, section.wordCountMax)
}

/** MOCK: synthesize paragraph text from a generationHint prompt. */
function buildPromptMock(section: TemplateSection, ctx: GenerationContext): string {
  const hint = section.generationHint || section.title || "展开本节内容"
  const title = ctx.documentTitle || "本次公文"
  const unit = ctx.draftingUnit || "本单位"
  const notes = ctx.additionalNotes
    ? `结合要求"${ctx.additionalNotes.slice(0, 40)}"`
    : "结合工作实际"

  const lead = `${section.title}。`
  const body = `围绕"${hint}",${notes}组织${title}的相关内容。`
  const tail = `（${unit}拟稿,供修改完善）`
  return `${lead}${body}${tail}`
}

/** Pad with filler or trim to honor word-count bounds (Chinese char count). */
function constrainWordCount(
  text: string,
  min: number | null,
  max: number | null,
): string {
  if (min == null && max == null) return text
  let count = Array.from(text).length
  let out = text

  // Trim if over max
  if (max != null && count > max) {
    const chars = Array.from(text)
    out = chars.slice(0, max).join("")
    count = max
  }

  // Pad if under min (filler sentence repeated)
  if (min != null && count < min) {
    const filler = "为进一步落实相关要求,需结合实际情况补充具体措施和安排。"
    while (Array.from(out).length < min) {
      out += filler
    }
    // Trim back to min if overshoot
    out = Array.from(out).slice(0, Math.max(min, Array.from(out).length)).join("")
  }

  return out
}

/** Parse placeholder names from a fill-mode section (for display in config page). */
export function collectPlaceholders(sections: TemplateSection[]): string[] {
  const set = new Set<string>()
  for (const s of sections) {
    if (s.writingMode !== "fill") continue
    for (const name of parsePlaceholders(s.fillTemplate)) set.add(name)
  }
  return Array.from(set)
}

/**
 * Assemble a complete document string from per-section results.
 * Layout: title → grouped sections (heading + body) → 落款 (drafting unit + date placeholder).
 */
export function assembleDocument(
  title: string,
  draftingUnit: string,
  groups: SectionResult[][],
): string {
  const lines: string[] = []

  if (title.trim()) lines.push(title.trim(), "")

  groups.forEach((group, gi) => {
    const parent = group[0]
    if (parent) {
      lines.push(`${gi + 1}、${parent.title}`)
      if (parent.content.trim()) lines.push("", parent.content.trim(), "")
    }
    group.slice(1).forEach((child, ci) => {
      lines.push(`${gi + 1}.${ci + 1} ${child.title}`)
      if (child.content.trim()) lines.push("", child.content.trim(), "")
    })
  })

  // 落款
  const unit = draftingUnit.trim()
  lines.push("", unit || "（发文机关署名）", "【待补:成文日期】")

  return lines.join("\n")
}

/** Human-readable word range label, mirroring template-write-view. */
export function wordRangeLabel(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}-${max}字`
  if (min != null) return `≥${min}字`
  if (max != null) return `≤${max}字`
  return ""
}
