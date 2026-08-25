/**
 * AI 风格模板提取:调用 OpenAI 兼容 LLM,从文档文本语义化识别公文风格规格 + 范文片段,
 * 生成 StyleTemplate。
 *
 * 架构同 llm-extract-template.ts:前端直连演示版,密钥用 NEXT_PUBLIC_LLM_*。
 * 未配置或失败时,调用方应回退到 mock(mockExtractStyleFromFile)。
 */

import type { StyleTemplate, StyleSpec, DocumentType, Direction } from "@/data/style"

const uid = () => crypto.randomUUID()

const LLM_BASE_URL = process.env.NEXT_PUBLIC_LLM_BASE_URL
const LLM_API_KEY = process.env.NEXT_PUBLIC_LLM_API_KEY
const LLM_MODEL = process.env.NEXT_PUBLIC_LLM_MODEL

/** LLM 未配置(缺 env),调用方据此静默回退 mock。 */
export class LLMStyleNotConfiguredError extends Error {
  constructor() {
    super("LLM 未配置(NEXT_PUBLIC_LLM_* 缺失)")
    this.name = "LLMStyleNotConfiguredError"
  }
}

const MAX_TEXT_LEN = 12000
function truncate(text: string): string {
  if (text.length <= MAX_TEXT_LEN) return text
  return text.slice(0, MAX_TEXT_LEN) + "\n\n[文档较长,已截断]"
}

const SYSTEM_PROMPT = `你是一个公文风格提取助手。用户会给你一段从文档提取的纯文本,你的任务是分析其风格特征,输出一个结构化的风格模板。

要求:
1. styleSpec:识别文档的公文规格
   - documentType:文种,必须是以下之一之一:"通知" "请示" "报告" "批复" "函" "纪要" "通报" "讲话" "简报" "调研报告" "工作总结" "其他"
   - direction:行文方向,必须是以下之一:"上行" "下行" "平行" "对内" "对外"
   - audience:受众对象(如"下级各单位""上级机关"等)
   - tone:语气(如"庄重严谨""恳切谦谨""平实客观"等)
   - person:人称偏好(如"第三人称""第一人称复数"等)
   - sentenceStyle:句式(如"短句为主,排比增强气势""逻辑清晰,长短句结合"等)
   - diction:用词(如"公文规范用语""口语化表达适度穿插"等)
   - lengthRhythm:篇幅节奏(如"一事一报,短小精悍""情况—做法—成效—问题—下步推进"等)
2. writingRequirements:从文档中摘取 2-4 段最能体现该风格的原文片段(每段一句或一小段,保留原文措辞),作为正向风格参考样本。
3. 严格输出 JSON,格式:{"styleSpec":{"documentType":"","direction":"","audience":"","tone":"","person":"","sentenceStyle":"","diction":"","lengthRhythm":""},"writingRequirements":["片段1","片段2"]}。不要输出任何 JSON 以外的文字。`

interface LLMResult {
  styleSpec?: Partial<StyleSpec>
  writingRequirements?: string[]
}

const VALID_DOC_TYPES: DocumentType[] = ["通知", "请示", "报告", "批复", "函", "纪要", "通报", "讲话", "简报", "调研报告", "工作总结", "其他"]
const VALID_DIRECTIONS: Direction[] = ["上行", "下行", "平行", "对内", "对外"]

/**
 * 调用 LLM 提取风格模板。失败抛 Error,调用方回退 mock。
 * 未配置 env 抛 LLMStyleNotConfiguredError。
 */
export async function llmExtractStyle(text: string, fileName: string): Promise<StyleTemplate> {
  if (!LLM_BASE_URL || !LLM_API_KEY || !LLM_MODEL) {
    throw new LLMStyleNotConfiguredError()
  }
  if (!text.trim()) throw new Error("文档内容为空,无法提取")

  const body = {
    model: LLM_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
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

  const spec = parsed.styleSpec ?? {}
  // 校验枚举字段,非法值置空
  const documentType = VALID_DOC_TYPES.includes(spec.documentType as DocumentType) ? (spec.documentType as DocumentType) : ""
  const direction = VALID_DIRECTIONS.includes(spec.direction as Direction) ? (spec.direction as Direction) : ""

  const styleSpec: StyleSpec = {
    documentType,
    direction,
    audience: (spec.audience ?? "").trim(),
    tone: (spec.tone ?? "").trim(),
    person: (spec.person ?? "").trim(),
    sentenceStyle: (spec.sentenceStyle ?? "").trim(),
    diction: (spec.diction ?? "").trim(),
    lengthRhythm: (spec.lengthRhythm ?? "").trim(),
  }

  const writingRequirements = Array.isArray(parsed.writingRequirements)
    ? parsed.writingRequirements.map((r) => String(r).trim()).filter(Boolean)
    : []

  if (writingRequirements.length === 0) throw new Error("LLM 未提取出范文片段")

  const now = new Date().toISOString()
  return {
    id: uid(),
    name: `从文件提取：${fileName}`,
    source: "file",
    sourceFileName: fileName,
    styleSpec,
    writingRequirements,
    createdAt: now,
    updatedAt: now,
  }
}
