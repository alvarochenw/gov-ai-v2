/**
 * 从纯文本(如 .docx 提取出的文本)识别公文结构,生成 WritingTemplate。
 * 替代 mockExtractFromFile 的"文件名关键词匹配" —— 用真实文本内容识别章节标题。
 *
 * 纯函数,无延迟,可测。
 */

import type { WritingTemplate, TemplateSection, SectionWritingMode } from "@/data/template"

const uid = () => crypto.randomUUID()

/** 公文一级标题模式:一、二、三 / 1、2、3 / 第一章 等 */
const LEVEL1_RE = /^(第[一二三四五六七八九十百]+[章节部分]|[一二三四五六七八九十百]+[、.．]|（[一二三四五六七八九十百]+）|[0-9]+[、.．])\s*(.+)$/
/** 公文二级标题模式:（一）（二） / 1.1 2.1 等 */
const LEVEL2_RE = /^(（[一二三四五六七八九十百]+）|\([一二三四五六七八九十百]+\)|[0-9]+\.[0-9]+)\s*(.+)$/

/** 段落摘要:取首段非空文本,截断到 wordCountMax 内的合理长度。 */
function summarize(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (!clean) return ""
  return clean.length > max ? clean.slice(0, max) + "…" : clean
}

/** 按字数估算章节字数范围。 */
function estimateWordRange(text: string): { min: number | null; max: number | null } {
  const len = Array.from(text).length
  if (len === 0) return { min: 100, max: 300 }
  return { min: Math.max(50, Math.floor(len * 0.8)), max: Math.max(200, Math.ceil(len * 1.2)) }
}

/**
 * 从纯文本提取模板结构。
 * 文本为空或无法识别任何标题时,回退到通用公文默认结构。
 */
export function extractTemplateFromText(text: string, fileName: string): WritingTemplate {
  const now = new Date().toISOString()
  const name = `从文件提取：${fileName}`
  const base = { id: uid(), name, source: "file" as const, sourceFileName: fileName, createdAt: now, updatedAt: now }

  const lines = text.split(/\r?\n/).map((l) => l.trim())

  // 收集识别到的标题:按出现顺序,记录层级与所在行号
  const headings: { level: 1 | 2; title: string; lineIndex: number }[] = []
  lines.forEach((line, idx) => {
    if (!line) return
    const l2 = line.match(LEVEL2_RE)
    if (l2) {
      headings.push({ level: 2, title: l2[2].trim(), lineIndex: idx })
      return
    }
    const l1 = line.match(LEVEL1_RE)
    if (l1) {
      headings.push({ level: 1, title: l1[2].trim(), lineIndex: idx })
    }
  })

  // 仅保留一级标题(本次单点接入先做扁平结构,不处理二级嵌套,避免过度复杂)
  const level1 = headings.filter((h) => h.level === 1)

  if (level1.length === 0) {
    // 无法识别结构 → 回退通用公文默认
    return { ...base, sections: fallbackSections() }
  }

  // 为每个一级标题截取其下文本(到下一个标题为止)作为 hint 素材
  const sections: TemplateSection[] = level1.map((h, i) => {
    const start = h.lineIndex + 1
    const end = i + 1 < headings.length ? headings[i + 1].lineIndex : lines.length
    const body = lines.slice(start, end).join(" ")
    const { min, max } = estimateWordRange(body)
    return buildSection({
      title: h.title,
      generationHint: summarize(body) || `围绕"${h.title}"展开具体内容`,
      wordCountMin: min,
      wordCountMax: max,
      order: i,
    })
  })

  return { ...base, sections }
}

/** 构造一个完整 TemplateSection(默认 level-1 prompt 模式)。供正则提取与 LLM 提取复用。 */
export function buildSection(args: {
  title: string
  level?: 1 | 2
  parentId?: string | null
  generationHint?: string
  writingMode?: SectionWritingMode
  fillTemplate?: string
  wordCountMin?: number | null
  wordCountMax?: number | null
  order: number
}): TemplateSection {
  return {
    id: uid(),
    title: args.title,
    fixedTitle: true,
    required: true,
    generationHint: args.generationHint ?? "",
    wordCountMin: args.wordCountMin ?? null,
    wordCountMax: args.wordCountMax ?? null,
    order: args.order,
    level: args.level ?? 1,
    parentId: args.parentId ?? null,
    writingMode: args.writingMode ?? "prompt",
    fillTemplate: args.fillTemplate ?? "",
    referenceFiles: [],
  }
}

/** 兜底:无法识别标题时的通用公文结构。 */
function fallbackSections(): TemplateSection[] {
  return [
    buildSection({ title: "一、背景概述", generationHint: "概述文件背景和基本情况", wordCountMin: 100, wordCountMax: 400, order: 0 }),
    buildSection({ title: "二、主要内容", generationHint: "详细列述核心内容和措施", wordCountMin: 300, wordCountMax: 1000, order: 1 }),
    buildSection({ title: "三、相关要求", generationHint: "提出落实要求和保障措施", wordCountMin: 100, wordCountMax: 400, order: 2 }),
    buildSection({ title: "四、落款", generationHint: "发文机关和日期", wordCountMin: 20, wordCountMax: 50, order: 3 }),
  ]
}
