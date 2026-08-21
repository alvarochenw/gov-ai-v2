/**
 * Style writing data: types, preset style templates, mock extraction, and localStorage helpers.
 *
 * Redesigned around 文种 (document type) driven style definition:
 * a structured StyleSpec (公文规格表) + a list of writingRequirements (写作要求条目).
 */

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type DocumentType =
  | "通知" | "请示" | "报告" | "批复" | "函"
  | "纪要" | "通报" | "讲话" | "简报" | "调研报告"
  | "工作总结" | "其他"

export type Direction = "上行" | "下行" | "平行" | "对内" | "对外"

/** Structured 公文规格 table. All fields optional (empty = no constraint). */
export interface StyleSpec {
  documentType: DocumentType | ""   // 文种
  direction: Direction | ""         // 行文方向
  audience: string                  // 受众对象
  tone: string                      // 语气
  person: string                    // 人称偏好
  sentenceStyle: string             // 句式
  diction: string                   // 用词
  lengthRhythm: string              // 篇幅节奏
}

export interface StyleTemplate {
  id: string
  name: string
  source: "file" | "custom"
  sourceFileName?: string
  styleSpec: StyleSpec              // structured spec (replaces dimensions)
  writingRequirements: string[]     // actionable writing requirement items (replaces single styleNote)
  createdAt: string
  updatedAt: string
}

/**
 * @deprecated Retained only for the legacy `style-write-view.tsx` page which still
 * renders via the hidden `write-style` view. New code should use StyleSpec instead.
 */
export interface StyleDimension {
  id: string
  name: string
  value: string
  fixedName: boolean
  required: boolean
  order: number
}

/** Empty spec helper. */
export function emptyStyleSpec(): StyleSpec {
  return {
    documentType: "",
    direction: "",
    audience: "",
    tone: "",
    person: "",
    sentenceStyle: "",
    diction: "",
    lengthRhythm: "",
  }
}

/* ------------------------------------------------------------------ */
/*  Recommended spec per document type (for 一键填充)                  */
/* ------------------------------------------------------------------ */

const RECOMMENDED_SPEC: Record<Exclude<DocumentType, "其他">, StyleSpec> = {
  "通知":      { documentType: "通知",  direction: "下行", audience: "下级机关",        tone: "严肃正式",       person: "第三人称",        sentenceStyle: "简洁明快，短句为主",   diction: "规范公文用语，避免口语化",   lengthRhythm: "简洁明快" },
  "请示":      { documentType: "请示",  direction: "上行", audience: "上级机关",        tone: "谦谨敬重",       person: "第三人称",        sentenceStyle: "用语敬重，语气恳切",   diction: "规范公文用语，用语得体", lengthRhythm: "简明扼要" },
  "报告":      { documentType: "报告",  direction: "上行", audience: "上级机关",        tone: "客观陈述",       person: "第三人称",        sentenceStyle: "详略得当，逻辑清晰",   diction: "公文规范用语，辅以数据支撑",   lengthRhythm: "详略得当" },
  "批复":      { documentType: "批复",  direction: "下行", audience: "下级机关",        tone: "明确果断",       person: "第三人称",        sentenceStyle: "简短明确，一语中的",   diction: "规范公文用语",      lengthRhythm: "简短明确" },
  "函":        { documentType: "函",    direction: "平行", audience: "平行/不相隶属机关", tone: "平和礼貌",       person: "第三人称",        sentenceStyle: "语气平和，措辞得体",   diction: "规范公文用语，礼貌表达",     lengthRhythm: "简明得体" },
  "纪要":      { documentType: "纪要",  direction: "对内", audience: "参会单位",        tone: "客观记叙",       person: "第三人称",        sentenceStyle: "客观记述，条理清楚",   diction: "规范公文用语",       lengthRhythm: "条目精炼" },
  "通报":      { documentType: "通报",  direction: "下行", audience: "下级机关",        tone: "严肃郑重",       person: "第三人称",        sentenceStyle: "陈述清楚，要求明确",   diction: "规范公文用语",         lengthRhythm: "详略得当" },
  "讲话":      { documentType: "讲话",  direction: "对内", audience: "听众/干部",       tone: "庄重权威",       person: "第一人称复数为主",   sentenceStyle: "排比为主，善用长句增强气势", diction: "政策术语密集，善用号召性表达",   lengthRhythm: "长篇论述" },
  "简报":      { documentType: "简报",  direction: "对内", audience: "内部单位",        tone: "精炼概括",       person: "第三人称",        sentenceStyle: "短句条目化，一事一报",  diction: "规范简练用语",     lengthRhythm: "精炼简短" },
  "调研报告":  { documentType: "调研报告", direction: "对内", audience: "决策层/领导",     tone: "客观中立",       person: "第三人称",        sentenceStyle: "数据论证，逻辑递进",   diction: "专业术语为主，辅以数据支撑",      lengthRhythm: "详略得当" },
  "工作总结":  { documentType: "工作总结", direction: "对内", audience: "上级/内部",      tone: "客观陈述",       person: "第三人称",        sentenceStyle: "详略得当，逻辑清晰",   diction: "公文规范用语，辅以数据支撑",   lengthRhythm: "详略得当" },
}

/** Get the recommended spec for a document type (returns blank for "其他"). */
export function recommendedSpecFor(docType: DocumentType | ""): StyleSpec {
  if (!docType || docType === "其他") return emptyStyleSpec()
  return { ...RECOMMENDED_SPEC[docType] }
}

/* ------------------------------------------------------------------ */
/*  Preset style templates                                           */
/* ------------------------------------------------------------------ */

const uid = () => crypto.randomUUID()

export const presetStyleTemplates: StyleTemplate[] = [
  {
    id: "preset-notice",
    name: "通知",
    source: "custom",
    styleSpec: { ...RECOMMENDED_SPEC["通知"] },
    writingRequirements: [
      "行文简洁规范，事项条目化呈现",
      "用词严谨统一，不使用修辞手法",
      "通知事项逐条列述，要求明确具体",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "preset-request",
    name: "请示",
    source: "custom",
    styleSpec: { ...RECOMMENDED_SPEC["请示"] },
    writingRequirements: [
      "缘由充分，事项明确，请求具体",
      "用语敬重恳切，语气谦谨",
      "结尾以请求批示收束，如'妥否，请批示'",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "preset-report",
    name: "报告/工作总结",
    source: "custom",
    styleSpec: { ...RECOMMENDED_SPEC["工作总结"] },
    writingRequirements: [
      "客观陈述，成绩与问题并重",
      "以事实和数据为支撑，避免空话套话",
      "结构按 情况—做法—成效—问题—下步安排 推进",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "preset-leader-speech",
    name: "领导讲话",
    source: "custom",
    styleSpec: { ...RECOMMENDED_SPEC["讲话"] },
    writingRequirements: [
      "善用排比句式增强气势",
      "段落开头以短句点题",
      "结尾以号召性语言收束全文",
      "庄重但不刻板，适当穿插口语化表达",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "preset-research-report",
    name: "调研报告",
    source: "custom",
    styleSpec: { ...RECOMMENDED_SPEC["调研报告"] },
    writingRequirements: [
      "以事实和数据为支撑，逻辑层层递进",
      "观点需有据可查，避免主观臆断",
      "结论部分提出可操作性建议",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "preset-briefing",
    name: "工作简报",
    source: "custom",
    styleSpec: { ...RECOMMENDED_SPEC["简报"] },
    writingRequirements: [
      "精炼概括，一事一报",
      "短句条目化呈现，不铺陈",
      "标题导语点明主旨，主体条目化展开",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/* ------------------------------------------------------------------ */
/*  Mock extraction                                                   */
/* ------------------------------------------------------------------ */

export async function mockExtractStyleFromFile(fileName: string): Promise<StyleTemplate> {
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const now = new Date().toISOString()
  const lower = fileName.toLowerCase()

  const base = (docType: Exclude<DocumentType, "其他">): StyleTemplate => ({
    id: uid(),
    name: `从文件提取：${fileName}`,
    source: "file",
    sourceFileName: fileName,
    styleSpec: { ...RECOMMENDED_SPEC[docType] },
    writingRequirements: [`从参考文件提取的${docType}风格要求`],
    createdAt: now,
    updatedAt: now,
  })

  if (lower.includes("讲话") || lower.includes("发言")) return base("讲话")
  if (lower.includes("通知") || lower.includes("公告") || lower.includes("通告")) return base("通知")
  if (lower.includes("请示") || lower.includes("批复")) return base("请示")
  if (lower.includes("简报")) return base("简报")
  if (lower.includes("调研") || lower.includes("研究")) return base("调研报告")
  if (lower.includes("总结") || lower.includes("报告")) return base("工作总结")

  // Default: generic government document style
  return {
    id: uid(),
    name: `从文件提取：${fileName}`,
    source: "file",
    sourceFileName: fileName,
    styleSpec: { ...emptyStyleSpec(), documentType: "其他", tone: "正式规范", person: "第三人称", sentenceStyle: "逻辑清晰，长短句结合", diction: "公文规范用语" },
    writingRequirements: ["从参考文件提取：整体风格正式规范，行文逻辑清晰，用词准确得体"],
    createdAt: now,
    updatedAt: now,
  }
}

/* ------------------------------------------------------------------ */
/*  Normalization (backward compat for old localStorage)             */
/* ------------------------------------------------------------------ */

const DIM_NAME_TO_SPEC_FIELD: Record<string, keyof StyleSpec> = {
  "语气风格": "tone",
  "人称偏好": "person",
  "句式偏好": "sentenceStyle",
  "用词特点": "diction",
}

/** Migrate an old-style template (with dimensions/styleNote) to the new structure. */
export function normalizeStyleTemplate(t: StyleTemplate & { dimensions?: StyleDimension[]; styleNote?: string }): StyleTemplate {
  const spec = t.styleSpec ? { ...emptyStyleSpec(), ...t.styleSpec } : emptyStyleSpec()

  // backfill spec fields from legacy dimensions
  if (Array.isArray(t.dimensions)) {
    for (const d of t.dimensions) {
      const field = DIM_NAME_TO_SPEC_FIELD[d.name]
      if (field && !spec[field]) (spec as unknown as Record<string, string>)[field] = d.value
    }
    // derive documentType from template name heuristics
    if (!spec.documentType) {
      const name = t.name || ""
      for (const key of Object.keys(RECOMMENDED_SPEC) as Exclude<DocumentType, "其他">[]) {
        if (name.includes(key)) { spec.documentType = key; break }
      }
    }
  }

  // migrate styleNote → writingRequirements (split by 。/；/，)
  let writingRequirements = t.writingRequirements
  if (!Array.isArray(writingRequirements)) {
    const note = (t as { styleNote?: string }).styleNote || ""
    writingRequirements = note
      ? note.split(/[。；；\n]/).map((s) => s.trim()).filter(Boolean)
      : []
  }

  return {
    id: t.id,
    name: t.name,
    source: t.source,
    sourceFileName: t.sourceFileName,
    styleSpec: spec,
    writingRequirements,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                              */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "style-write-templates"

export function loadSavedStyleTemplates(): StyleTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...presetStyleTemplates]
    const userSaved = JSON.parse(raw) as (StyleTemplate & { dimensions?: StyleDimension[]; styleNote?: string })[]
    const map = new Map<string, StyleTemplate>()
    for (const t of presetStyleTemplates) map.set(t.id, t)
    for (const t of userSaved) map.set(t.id, normalizeStyleTemplate(t))
    return Array.from(map.values())
  } catch {
    return [...presetStyleTemplates]
  }
}

export function saveStyleTemplates(templates: StyleTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch {
    // silently fail
  }
}

/** Create a blank style template with an empty spec and no requirements. */
export function createBlankStyleTemplate(name = ""): StyleTemplate {
  return {
    id: uid(),
    name,
    source: "custom",
    styleSpec: emptyStyleSpec(),
    writingRequirements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
