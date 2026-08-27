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
    // fill 模式:仅替换 {{占位符}},固定文本不可改;全局提示词(additionalNotes)不参与
    // fill 章节的文本生成——用户只能通过占位符值影响 fill 章节。本次快速写作向导
    // 不收集占位符值,故未填占位符输出【待补:字段名】。见 docs/模板库AI功能实现逻辑.md §7.2/§7.8。
    section.writingMode === "fill"
      ? applyPlaceholders(section.fillTemplate, ctx.placeholderValues)
      : buildPromptMock(section, ctx)

  // Pad/trim toward the declared word range so the mock respects constraints.
  return constrainWordCount(base, section.wordCountMin, section.wordCountMax)
}

/**
 * Build a structured, layered generation instruction for one section (prompt mode).
 *
 * Two layers that do not exclude each other:
 *   1. 结构意图 — from the template's generationHint (what this section covers)
 *   2. 用户附加要求 — from the global additionalNotes (per-task 口径/重点/约束)
 *
 * Conflict rule: the user layer wins. docs/模板库AI功能实现逻辑.md §7.2 ranks
 * "user explicit input" above "structure template generationHint"; the prompt
 * states this explicitly so a future real LLM honors the priority.
 *
 * (Mock stage: buildPromptMock below derives placeholder text from the same
 * inputs; a real LLM would consume this structured prompt directly.)
 */
function buildSectionPrompt(section: TemplateSection, ctx: GenerationContext): string {
  const hint = section.generationHint || section.title || "展开本节内容"
  const lines: string[] = [`生成章节：${section.title}`, `本章结构意图（模板定义）：${hint}`]
  const notes = ctx.additionalNotes.trim()
  if (notes) {
    lines.push(`用户附加要求（优先级高于结构意图,如有冲突以用户要求为准）：${notes}`)
  }
  if (ctx.documentTitle.trim()) lines.push(`文稿标题：${ctx.documentTitle}`)
  if (ctx.draftingUnit.trim()) lines.push(`拟稿单位：${ctx.draftingUnit}`)
  const range = wordRangeLabel(section.wordCountMin, section.wordCountMax)
  if (range) lines.push(`篇幅要求：${range}`)
  lines.push("只返回章节正文,不返回标题和解释。")
  return lines.join("\n")
}

/** Expose the layered instruction so future real-LLM adapters can consume it
 *  without re-deriving the structure-vs-user priority rules. */
export function getSectionPrompt(section: TemplateSection, ctx: GenerationContext): string {
  return buildSectionPrompt(section, ctx)
}

/** MOCK: synthesize paragraph text from a generationHint prompt.
 *  Keeps the full additionalNotes (not truncated) so the user's per-task
 *  requirements are visible in the mock output. A real LLM would consume
 *  buildSectionPrompt directly instead of this mock body. */
function buildPromptMock(section: TemplateSection, ctx: GenerationContext): string {
  const hint = section.generationHint || section.title || "展开本节内容"
  const title = ctx.documentTitle || "本次公文"
  const unit = ctx.draftingUnit || "本单位"
  const notes = ctx.additionalNotes.trim()
    ? `结合要求"${ctx.additionalNotes}"`
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
