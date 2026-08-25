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
      "现将有关事项通知如下：一、请各单位于X月X日前完成本辖区风险隐患排查整治工作，建立问题台账并实行销号管理；二、严格落实安全生产主体责任，明确到岗到人，确保各项措施落地见效；三、加强督导检查，定期通报进展，对落实不力的严肃追责问责。",
      "经研究，决定于X月X日召开XX工作会议。现将有关事项通知如下：一、会议时间：X月X日上（下）午X时；二、会议地点：XX会议室；三、参会人员：各单位主要负责同志；四、有关要求：请参会人员提前10分钟入场，会议期间请将手机调至静音。",
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
      "为切实做好XX工作，进一步提升XX能力水平，根据《XX办法》有关规定，结合我单位实际，拟于近期开展XX工作。经测算，共需经费XX万元，主要用于XX、XX等方面。鉴于该项工作已列入年度重点任务且时间紧迫，恳请上级予以支持并批准上述经费。",
      "近期，我单位在XX工作中遇到XX问题，涉及XX事项。经初步研究，拟按XX方案处理，具体为：一、……；二、……。鉴于该事项政策性较强且影响面较大，特此请示，妥否，请批示。",
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
      "今年以来，我单位围绕XX中心任务，扎实推进各项工作，取得阶段性成效。1至X月，累计完成XX任务XX项，同比增长XX%；办理XX事项XX件，办结率达XX%。主要做法：一是健全机制，制定出台《XX方案》，明确责任分工与时序进度；二是强化落实，建立周调度、月通报制度，确保任务到人到岗。",
      "在取得成绩的同时，工作中仍存在一些不容忽视的问题：一是XX推进不够平衡，部分领域进展滞后于预期；二是XX基础相对薄弱，XX能力有待进一步提升。下一步，将聚焦问题短板，重点抓好XX、XX等工作，力争年度目标任务高质量完成。",
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
      "同志们，这次会议是一次十分重要的会议。刚才，XX同志对下步工作作了具体部署，我都赞同。下面，我再强调三点意见：一要提高站位抓落实，以更高的政治站位认识XX工作的重大意义；二要聚焦重点抓落实，以更实的举措推进XX任务落地见效；三要压实责任抓落实，以更严的标准确保各项工作高质量完成。",
      "做好XX工作，使命光荣、责任重大。让我们以时不我待的紧迫感、舍我其谁的责任感，凝心聚力、真抓实干，奋力开创XX工作新局面，为XX作出新的更大贡献！",
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
      "近期，围绕XX课题，调研组赴XX、XX等地开展专题调研，走访单位XX家，座谈XX人次，查阅资料XX份。调研发现：一是XX工作总体推进有序，XX率达XX%，但存在XX不平衡问题；二是XX机制不够健全，XX环节衔接不畅；三是XX保障相对不足，制约工作质效提升。",
      "针对上述问题，建议：一要完善XX机制，出台《XX细则》，明确流程标准；二要强化XX保障，加大XX投入，充实XX力量；三要健全XX考核，将XX纳入绩效评价，形成闭环管理。以上建议供领导决策参考。",
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
      "【XX工作简报 第X期】XX单位纵深推进XX工作取得阶段性成效。今年以来，该单位坚持问题导向，创新工作举措，推动XX工作提质增效。一是抓机制，建立XX制度，规范XX流程；二是抓重点，聚焦XX环节，集中力量攻坚突破；三是抓督导，实行XX通报，倒逼责任落实。",
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
    writingRequirements: [`从参考文件提取的${docType}范文片段`],
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
    writingRequirements: ["从参考文件提取：该文种整体风格正式规范，行文逻辑清晰，用词准确得体，可作为范文片段参考"],
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
    // 先放代码版预设为基底,再用 localStorage 的项覆盖(含 preset- —— 后台修改的预设
    // 会覆盖代码版)。这样系统后台对预设的修改能生效。
    const map = new Map<string, StyleTemplate>()
    for (const t of presetStyleTemplates) map.set(t.id, t)
    for (const t of userSaved) {
      map.set(t.id, normalizeStyleTemplate(t))
    }
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
