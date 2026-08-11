/**
 * Style writing data: types, preset style templates, mock extraction, and localStorage helpers.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface StyleDimension {
  id: string
  name: string           // dimension name, e.g. "语气风格", "句式偏好"
  value: string          // dimension value, e.g. "严肃正式", "排比为主"
  fixedName: boolean     // whether the dimension name is locked (from file extraction)
  required: boolean      // required vs optional
  order: number
}

export interface StyleTemplate {
  id: string
  name: string
  source: "file" | "custom"
  sourceFileName?: string
  dimensions: StyleDimension[]
  styleNote: string      // free-text supplement describing the style
  createdAt: string
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/*  Preset style templates                                           */
/* ------------------------------------------------------------------ */

const uid = () => crypto.randomUUID()

export const presetStyleTemplates: StyleTemplate[] = [
  {
    id: "preset-leader-speech",
    name: "领导讲话体",
    source: "custom",
    dimensions: [
      { id: uid(), name: "语气风格", value: "庄重权威", fixedName: true, required: true, order: 0 },
      { id: uid(), name: "人称偏好", value: "第一人称复数为主", fixedName: true, required: true, order: 1 },
      { id: uid(), name: "句式偏好", value: "排比为主，善用长句增强气势", fixedName: true, required: true, order: 2 },
      { id: uid(), name: "用词特点", value: "政策术语密集，善用号召性表达", fixedName: true, required: false, order: 3 },
    ],
    styleNote: "善用排比句式增强气势，段落开头常以短句点题，结尾善用号召性语言收束全文。讲话风格庄重但不刻板，适当穿插口语化表达拉近与听众距离。",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "preset-notice",
    name: "机关通知体",
    source: "custom",
    dimensions: [
      { id: uid(), name: "语气风格", value: "严肃正式", fixedName: true, required: true, order: 0 },
      { id: uid(), name: "人称偏好", value: "第三人称", fixedName: true, required: true, order: 1 },
      { id: uid(), name: "句式偏好", value: "简洁明快，短句为主", fixedName: true, required: true, order: 2 },
      { id: uid(), name: "用词特点", value: "规范公文用语，避免口语化", fixedName: true, required: false, order: 3 },
    ],
    styleNote: "行文简洁规范，事项条目化呈现，用词严谨统一，不使用修辞手法。通知事项需逐条列述，要求明确具体。",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "preset-research-report",
    name: "调研报告体",
    source: "custom",
    dimensions: [
      { id: uid(), name: "语气风格", value: "客观中立", fixedName: true, required: true, order: 0 },
      { id: uid(), name: "人称偏好", value: "第三人称", fixedName: true, required: true, order: 1 },
      { id: uid(), name: "句式偏好", value: "数据论证，逻辑递进", fixedName: true, required: true, order: 2 },
      { id: uid(), name: "用词特点", value: "专业术语为主，辅以数据支撑", fixedName: true, required: false, order: 3 },
    ],
    styleNote: "以事实和数据为支撑，逻辑清晰层层递进。观点需有据可查，避免主观臆断。适当使用图表辅助说明，结论部分需提出可操作性建议。",
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

  if (lower.includes("讲话") || lower.includes("发言")) {
    return {
      id: uid(), name: `从文件提取：${fileName}`, source: "file", sourceFileName: fileName,
      dimensions: [
        { id: uid(), name: "语气风格", value: "庄重权威", fixedName: true, required: true, order: 0 },
        { id: uid(), name: "人称偏好", value: "第一人称复数", fixedName: true, required: true, order: 1 },
        { id: uid(), name: "句式偏好", value: "排比为主", fixedName: true, required: false, order: 2 },
        { id: uid(), name: "用词特点", value: "政策术语密集", fixedName: true, required: true, order: 3 },
      ],
      styleNote: "从参考文件中提取：善用排比句式增强气势，段落开头常以短句点题，结尾善用号召性语言。",
      createdAt: now, updatedAt: now,
    }
  }

  if (lower.includes("通知") || lower.includes("公告") || lower.includes("通告")) {
    return {
      id: uid(), name: `从文件提取：${fileName}`, source: "file", sourceFileName: fileName,
      dimensions: [
        { id: uid(), name: "语气风格", value: "严肃正式", fixedName: true, required: true, order: 0 },
        { id: uid(), name: "人称偏好", value: "第三人称", fixedName: true, required: true, order: 1 },
        { id: uid(), name: "句式偏好", value: "简洁明快", fixedName: true, required: true, order: 2 },
        { id: uid(), name: "用词特点", value: "规范公文用语", fixedName: true, required: false, order: 3 },
      ],
      styleNote: "从参考文件中提取：行文简洁规范，事项条目化呈现，用词严谨统一。",
      createdAt: now, updatedAt: now,
    }
  }

  if (lower.includes("调研") || lower.includes("报告") || lower.includes("研究")) {
    return {
      id: uid(), name: `从文件提取：${fileName}`, source: "file", sourceFileName: fileName,
      dimensions: [
        { id: uid(), name: "语气风格", value: "客观中立", fixedName: true, required: true, order: 0 },
        { id: uid(), name: "人称偏好", value: "第三人称", fixedName: true, required: true, order: 1 },
        { id: uid(), name: "句式偏好", value: "数据论证", fixedName: true, required: true, order: 2 },
        { id: uid(), name: "用词特点", value: "专业术语为主", fixedName: true, required: false, order: 3 },
      ],
      styleNote: "从参考文件中提取：以事实和数据为支撑，逻辑清晰层层递进，观点需有据可查。",
      createdAt: now, updatedAt: now,
    }
  }

  // Default: generic government document style
  return {
    id: uid(), name: `从文件提取：${fileName}`, source: "file", sourceFileName: fileName,
    dimensions: [
      { id: uid(), name: "语气风格", value: "正式规范", fixedName: true, required: true, order: 0 },
      { id: uid(), name: "人称偏好", value: "第三人称为主", fixedName: true, required: true, order: 1 },
      { id: uid(), name: "句式偏好", value: "逻辑清晰，长短句结合", fixedName: true, required: false, order: 2 },
      { id: uid(), name: "用词特点", value: "公文规范用语", fixedName: true, required: true, order: 3 },
    ],
    styleNote: "从参考文件中提取：整体风格正式规范，行文逻辑清晰，用词准确得体。",
    createdAt: now, updatedAt: now,
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
    const userSaved: StyleTemplate[] = JSON.parse(raw)
    const map = new Map<string, StyleTemplate>()
    for (const t of presetStyleTemplates) map.set(t.id, t)
    for (const t of userSaved) map.set(t.id, t)
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

/** Create a blank style template with one default dimension. */
export function createBlankStyleTemplate(name = ""): StyleTemplate {
  return {
    id: uid(),
    name,
    source: "custom",
    dimensions: [
      { id: uid(), name: "", value: "", fixedName: false, required: true, order: 0 },
    ],
    styleNote: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
