/**
 * AI 模板提取:调用 OpenAI 兼容 LLM,从文档文本语义化识别公文结构,生成 WritingTemplate。
 *
 * 架构:前端直连演示版。密钥用 NEXT_PUBLIC_LLM_* 前缀(进前端 bundle,仅内网/演示用,
 * 生产应改用 BFF 代理)。LLM 未配置或失败时,调用方应回退到正则提取(extractTemplateFromText)。
 *
 * OpenAI 兼容接口:POST {BASE_URL}/v1/chat/completions,Authorization: Bearer {KEY}。
 */

import type { WritingTemplate, TemplateSection, SectionWritingMode } from "@/data/template"
import { buildSection } from "@/lib/extract-template-from-text"

const uid = () => crypto.randomUUID()

const LLM_BASE_URL = process.env.NEXT_PUBLIC_LLM_BASE_URL
const LLM_API_KEY = process.env.NEXT_PUBLIC_LLM_API_KEY
const LLM_MODEL = process.env.NEXT_PUBLIC_LLM_MODEL

/** LLM 未配置(缺 env),调用方据此静默回退正则。 */
export class LLMNotConfiguredError extends Error {
  constructor() {
    super("LLM 未配置(NEXT_PUBLIC_LLM_* 缺失)")
    this.name = "LLMNotConfiguredError"
  }
}

/** 文档文本过长时截断(避免超出上下文)。 */
const MAX_TEXT_LEN = 12000
function truncate(text: string): string {
  if (text.length <= MAX_TEXT_LEN) return text
  return text.slice(0, MAX_TEXT_LEN) + "\n\n[文档较长,已截断]"
}

/** LLM 应输出的 JSON 结构。 */
interface LLMSection {
  title: string
  level?: 1 | 2
  parentIndex?: number | null
  hint?: string
  fillTemplate?: string
  wordMin?: number | null
  wordMax?: number | null
}
interface LLMResult {
  sections: LLMSection[]
}

/** 按写作模式构造 system prompt。
 *  - prompt 模式:每节给 hint(一句话描述该节写什么)。
 *  - fill 模式:每节给 fillTemplate = 文档原文片段,把日期/数字/单位/人名/金额等
 *    具体值替换为语义化中文 {{占位符}},固定文字保留原文。
 */
function buildSystemPrompt(mode: SectionWritingMode): string {
  const common = `你是一个公文结构提取助手。用户会给你一段从文档提取的纯文本,你的任务是识别其中的公文结构,输出一个结构化模板。

通用要求:
1. 识别文档的各级标题(一级标题如"一、""1.""第一章",二级标题如"（一）""1.1"),按出现顺序输出。
2. 若文档无明显标题,按内容语义划分章节(如背景、主要内容、相关要求、落款等),并为每节拟定简明标题。
3. level:1=一级标题,2=二级标题;二级标题用 parentIndex 指明其父级在 sections 数组中的序号(0-based)。
4. 给出建议字数范围 wordMin/wordMax(基于该章节实际内容长度估算)。`

  if (mode === "fill") {
    return `${common}

本次为"文本+占位符"模式:每个章节给出 fillTemplate 字段,内容是**该章节在文档中的原文片段**(尽量保留原文措辞与结构,不要改写)。
要求:
1. 把原文中需要后续填写的具体值替换为语义化中文占位符,用 {{}} 包裹。例如:
   - 日期 → {{日期}}
   - 数量/金额 → {{数量}} / {{金额}}
   - 单位/部门/人名 → {{单位}} / {{部门}} / {{姓名}}
   - 百分比/指标 → {{完成率}} / {{指标}}
2. 保留原文中通用的、固定的表述(如"现将有关事项通知如下""请认真贯彻落实"等)。
3. 占位符名称要语义化、简短(2-6 字),同义值用同一占位符名。
4. 严格输出 JSON,格式:{"sections":[{"title":"","level":1,"parentIndex":null,"fillTemplate":"","wordMin":100,"wordMax":300}]}。不要输出 JSON 以外的文字。`
  }

  return `${common}

本次为"提示词"模式:每个章节给出 hint 字段,一句话说明该章节应写什么内容(15-40 字)。
严格输出 JSON,格式:{"sections":[{"title":"","level":1,"parentIndex":null,"hint":"","wordMin":100,"wordMax":300}]}。不要输出 JSON 以外的文字。`
}

/**
 * 调用 LLM 提取模板。失败(网络/非 200/解析失败/校验不过)抛 Error,调用方回退正则。
 * 未配置 env 抛 LLMNotConfiguredError。
 * mode 决定 LLM 产出 hint(prompt 模式)还是原文片段+占位符的 fillTemplate(fill 模式)。
 */
export async function llmExtractTemplate(
  text: string,
  fileName: string,
  mode: SectionWritingMode,
): Promise<WritingTemplate> {
  if (!LLM_BASE_URL || !LLM_API_KEY || !LLM_MODEL) {
    throw new LLMNotConfiguredError()
  }
  if (!text.trim()) throw new Error("文档内容为空,无法提取")

  const body = {
    model: LLM_MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt(mode) },
      { role: "user", content: `文件名:${fileName}\n\n文档内容:\n${truncate(text)}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  }

  const url = `${LLM_BASE_URL.replace(/\/$/, "")}/v1/chat/completions`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`LLM 请求失败(${res.status}):${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const content: string = data?.choices?.[0]?.message?.content ?? ""
  if (!content) throw new Error("LLM 返回内容为空")

  let parsed: LLMResult
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error("LLM 返回非合法 JSON")
  }

  const rawSections = Array.isArray(parsed.sections) ? parsed.sections : []
  if (rawSections.length === 0) throw new Error("LLM 未识别出任何章节")

  // 映射为 TemplateSection,二级标题 parentId 留空,后面二次回填真实 id
  const sections: TemplateSection[] = rawSections.map((s, i) => {
    const level: 1 | 2 = s.level === 2 ? 2 : 1
    const fillText = (s.fillTemplate || "").trim()
    // fill 模式:产出原文片段+占位符的 fillTemplate;prompt 模式:产出 hint
    return buildSection({
      title: (s.title || "").trim() || `章节${i + 1}`,
      level,
      parentId: null,
      writingMode: mode === "fill" && fillText ? "fill" : "prompt",
      fillTemplate: mode === "fill" ? fillText : "",
      generationHint: mode === "fill" ? "" : (s.hint || "").trim(),
      wordCountMin: typeof s.wordMin === "number" ? s.wordMin : null,
      wordCountMax: typeof s.wordMax === "number" ? s.wordMax : null,
      order: i,
    })
  })

  // 二次回填二级标题的 parentId(用真实 id)
  rawSections.forEach((s, i) => {
    if (sections[i].level === 2 && typeof s.parentIndex === "number" && s.parentIndex >= 0 && s.parentIndex < i) {
      sections[i].parentId = sections[s.parentIndex].id
    }
  })

  const now = new Date().toISOString()
  return {
    id: uid(),
    name: `从文件提取：${fileName}`,
    source: "file",
    sourceFileName: fileName,
    sections,
    createdAt: now,
    updatedAt: now,
  }
}
