/**
 * Template writing data: types, preset templates, mock extraction, and localStorage helpers.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface TemplateSection {
  id: string
  title: string
  fixedTitle: boolean       // locked title (e.g. from file extraction)
  required: boolean         // required vs optional section
  generationHint: string    // what AI should generate for this section
  wordCountMin: number | null
  wordCountMax: number | null
  order: number
}

export interface WritingTemplate {
  id: string
  name: string
  source: "file" | "custom"
  sourceFileName?: string
  sections: TemplateSection[]
  createdAt: string
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/*  Preset templates                                                  */
/* ------------------------------------------------------------------ */

const uid = () => crypto.randomUUID()

export const presetTemplates: WritingTemplate[] = [
  {
    id: "preset-notice",
    name: "通知",
    source: "custom",
    sections: [
      {
        id: uid(), title: "发文缘由", fixedTitle: true, required: true,
        generationHint: "说明发文背景、依据和目的", wordCountMin: 100, wordCountMax: 300, order: 0,
      },
      {
        id: uid(), title: "通知事项", fixedTitle: true, required: true,
        generationHint: "逐条列述通知的具体事项和要求", wordCountMin: 300, wordCountMax: 800, order: 1,
      },
      {
        id: uid(), title: "工作要求", fixedTitle: true, required: false,
        generationHint: "对执行落实提出具体要求、时限和责任人", wordCountMin: 100, wordCountMax: 300, order: 2,
      },
      {
        id: uid(), title: "落款格式", fixedTitle: true, required: true,
        generationHint: "发文机关署名和成文日期", wordCountMin: 20, wordCountMax: 50, order: 3,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "preset-request",
    name: "请示",
    source: "custom",
    sections: [
      {
        id: uid(), title: "请示缘由", fixedTitle: true, required: true,
        generationHint: "说明请示的背景、原因和依据", wordCountMin: 150, wordCountMax: 400, order: 0,
      },
      {
        id: uid(), title: "请示事项", fixedTitle: true, required: true,
        generationHint: "明确需要上级批示的具体事项和方案", wordCountMin: 200, wordCountMax: 600, order: 1,
      },
      {
        id: uid(), title: "请求批示", fixedTitle: true, required: true,
        generationHint: "明确提出请示请求，如'妥否，请批示'", wordCountMin: 20, wordCountMax: 80, order: 2,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "preset-summary",
    name: "工作总结",
    source: "custom",
    sections: [
      {
        id: uid(), title: "基本情况", fixedTitle: true, required: true,
        generationHint: "概述工作背景、时间范围和总体情况", wordCountMin: 100, wordCountMax: 300, order: 0,
      },
      {
        id: uid(), title: "主要工作", fixedTitle: true, required: true,
        generationHint: "详细列述主要工作措施和做法", wordCountMin: 500, wordCountMax: 1500, order: 1,
      },
      {
        id: uid(), title: "成效亮点", fixedTitle: true, required: true,
        generationHint: "总结工作取得的突出成效和创新亮点", wordCountMin: 200, wordCountMax: 600, order: 2,
      },
      {
        id: uid(), title: "存在问题", fixedTitle: true, required: false,
        generationHint: "分析工作中存在的不足和困难", wordCountMin: 100, wordCountMax: 400, order: 3,
      },
      {
        id: uid(), title: "下步计划", fixedTitle: true, required: true,
        generationHint: "提出下一步工作思路和重点安排", wordCountMin: 200, wordCountMax: 500, order: 4,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/* ------------------------------------------------------------------ */
/*  Mock extraction                                                   */
/* ------------------------------------------------------------------ */

export async function mockExtractFromFile(fileName: string): Promise<WritingTemplate> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const now = new Date().toISOString()
  const lower = fileName.toLowerCase()

  if (lower.includes("通知")) {
    return {
      id: uid(), name: `从文件提取：${fileName}`, source: "file", sourceFileName: fileName,
      sections: [
        { id: uid(), title: "一、发文缘由", fixedTitle: true, required: true, generationHint: "说明发文背景、依据和目的", wordCountMin: 100, wordCountMax: 300, order: 0 },
        { id: uid(), title: "二、通知事项", fixedTitle: true, required: true, generationHint: "逐条列述通知的具体事项", wordCountMin: 300, wordCountMax: 800, order: 1 },
        { id: uid(), title: "三、工作要求", fixedTitle: true, required: false, generationHint: "对执行落实提出具体要求", wordCountMin: 100, wordCountMax: 300, order: 2 },
      ],
      createdAt: now, updatedAt: now,
    }
  }

  if (lower.includes("请示") || lower.includes("批复")) {
    return {
      id: uid(), name: `从文件提取：${fileName}`, source: "file", sourceFileName: fileName,
      sections: [
        { id: uid(), title: "一、请示缘由", fixedTitle: true, required: true, generationHint: "说明请示的背景和原因", wordCountMin: 150, wordCountMax: 400, order: 0 },
        { id: uid(), title: "二、请示事项", fixedTitle: true, required: true, generationHint: "明确需要上级批示的具体事项", wordCountMin: 200, wordCountMax: 600, order: 1 },
        { id: uid(), title: "三、请求批示", fixedTitle: true, required: true, generationHint: "明确提出请示请求", wordCountMin: 20, wordCountMax: 80, order: 2 },
      ],
      createdAt: now, updatedAt: now,
    }
  }

  if (lower.includes("总结") || lower.includes("报告")) {
    return {
      id: uid(), name: `从文件提取：${fileName}`, source: "file", sourceFileName: fileName,
      sections: [
        { id: uid(), title: "一、基本情况", fixedTitle: true, required: true, generationHint: "概述工作背景和总体情况", wordCountMin: 100, wordCountMax: 300, order: 0 },
        { id: uid(), title: "二、主要工作", fixedTitle: true, required: true, generationHint: "详细列述主要工作措施", wordCountMin: 500, wordCountMax: 1500, order: 1 },
        { id: uid(), title: "三、成效亮点", fixedTitle: true, required: true, generationHint: "总结工作取得的突出成效", wordCountMin: 200, wordCountMax: 600, order: 2 },
        { id: uid(), title: "四、存在问题", fixedTitle: true, required: false, generationHint: "分析工作中存在的不足", wordCountMin: 100, wordCountMax: 400, order: 3 },
      ],
      createdAt: now, updatedAt: now,
    }
  }

  // Default: generic government document
  return {
    id: uid(), name: `从文件提取：${fileName}`, source: "file", sourceFileName: fileName,
    sections: [
      { id: uid(), title: "一、背景概述", fixedTitle: true, required: true, generationHint: "概述文件背景和基本情况", wordCountMin: 100, wordCountMax: 400, order: 0 },
      { id: uid(), title: "二、主要内容", fixedTitle: true, required: true, generationHint: "详细列述核心内容和措施", wordCountMin: 300, wordCountMax: 1000, order: 1 },
      { id: uid(), title: "三、相关要求", fixedTitle: true, required: false, generationHint: "提出落实要求和保障措施", wordCountMin: 100, wordCountMax: 400, order: 2 },
      { id: uid(), title: "四、落款", fixedTitle: true, required: true, generationHint: "发文机关和日期", wordCountMin: 20, wordCountMax: 50, order: 3 },
    ],
    createdAt: now, updatedAt: now,
  }
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                              */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "template-write-templates"

export function loadSavedTemplates(): WritingTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...presetTemplates]
    const userSaved: WritingTemplate[] = JSON.parse(raw)
    // Merge: presets are always present; user-saved override by id
    const map = new Map<string, WritingTemplate>()
    for (const t of presetTemplates) map.set(t.id, t)
    for (const t of userSaved) map.set(t.id, t)
    return Array.from(map.values())
  } catch {
    return [...presetTemplates]
  }
}

export function saveTemplates(templates: WritingTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch {
    // silently fail (quota exceeded, etc.)
  }
}

/** Create a blank template with one default section. */
export function createBlankTemplate(name = ""): WritingTemplate {
  return {
    id: uid(),
    name,
    source: "custom",
    sections: [
      {
        id: uid(), title: "", fixedTitle: false, required: true,
        generationHint: "", wordCountMin: null, wordCountMax: null, order: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
