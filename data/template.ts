/**
 * Template writing data: types, preset templates, mock extraction, and localStorage helpers.
 */

import type { ReferenceFile } from "@/lib/template-data"

/** Max number of templates (presets + custom) kept in the library. */
export const MAX_TEMPLATES = 10

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/** Per-section writing prompt mode. */
export type SectionWritingMode = "prompt" | "fill"

export interface TemplateSection {
  id: string
  title: string
  fixedTitle: boolean       // locked title (e.g. from file extraction)
  required: boolean         // required vs optional section
  level: 1 | 2              // 1 = top-level heading, 2 = sub heading
  parentId: string | null   // sub heading points to its parent top-level id; null for level 1
  writingMode: SectionWritingMode  // "prompt" uses generationHint; "fill" uses fillTemplate with {{placeholders}}
  generationHint: string    // prompt mode: what AI should generate for this section
  fillTemplate: string      // fill mode: text with {{placeholder}} tokens for AI to fill
  wordCountMin: number | null
  wordCountMax: number | null
  referenceFiles: ReferenceFile[]  // attached reference docs (only meaningful for level-1 headings)
  order: number
}

/** Ensure a section (possibly loaded from older localStorage) has all new fields. */
export function normalizeSection(s: TemplateSection): TemplateSection {
  return {
    ...s,
    level: s.level ?? 1,
    parentId: s.parentId ?? null,
    writingMode: s.writingMode ?? "prompt",
    fillTemplate: s.fillTemplate ?? "",
    referenceFiles: s.referenceFiles ?? [],
  }
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

/** Build a full TemplateSection from a raw definition. The structural fields
 *  (level / parentId / writingMode / fillTemplate / referenceFiles) are optional
 *  and fall back to level-1 prompt-mode defaults when omitted — so a preset can
 *  mix prompt-mode top-level headings with fill-mode sub-headings. */
type DefSection = Omit<TemplateSection, "level" | "parentId" | "writingMode" | "fillTemplate" | "referenceFiles">
  & Partial<Pick<TemplateSection, "level" | "parentId" | "writingMode" | "fillTemplate" | "referenceFiles">>
const def = (s: DefSection): TemplateSection => ({
  level: 1,
  parentId: null,
  writingMode: "prompt",
  fillTemplate: "",
  referenceFiles: [],
  ...s,
})

type RawTemplate = Omit<WritingTemplate, "sections"> & { sections: DefSection[] }

/* "每周警务工作总结" — written in a local 派出所 (police station) voice.
 *  Mixes prompt-mode headings with fill-mode sub-headings that carry example
 *  text + {{placeholders}}. Defined separately so the level-2 sections can
 *  reference their parent's id. */
const weeklyPolicePatrolId = uid()
const weeklyPoliceSummarySections: DefSection[] = [
  {
    id: uid(), title: "一、本周警务概况", fixedTitle: true, required: true,
    generationHint: "以派出所名义概述本周（起止日期）辖区社会治安总体形势，包括接处警总量、刑事/治安警情升降幅度和辖区稳定基本评价，语言简练客观。",
    wordCountMin: 150, wordCountMax: 350, order: 0,
  },
  {
    id: uid(), title: "二、接处警与案件办理", fixedTitle: true, required: true,
    writingMode: "fill", generationHint: "",
    fillTemplate: "本周我所共接处警{{接处警总数}}起，其中刑事警情{{刑事警情数}}起、治安警情{{治安警情数}}起、群众求助{{求助警情数}}起。立刑事案件{{刑事立案数}}起、受理治安案件{{治安立案数}}起，破获刑事案件{{破案数}}起、查处治安案件{{查处数}}起，抓获违法犯罪嫌疑人{{抓获人数}}名。重点办结{{重点案件名称}}等案件，{{案件办理结果}}。",
    wordCountMin: 200, wordCountMax: 500, order: 1,
  },
  {
    id: weeklyPolicePatrolId, title: "三、巡逻防控与社区警务", fixedTitle: true, required: true,
    generationHint: "总述本周辖区巡逻防控和社区警务工作开展情况，作为下文两个二级标题的引述，简明概括投入警力和总体成效。",
    wordCountMin: 80, wordCountMax: 200, order: 2,
  },
  {
    id: uid(), title: "（一）巡逻防控", fixedTitle: true, required: true,
    level: 2, parentId: weeklyPolicePatrolId, writingMode: "fill", generationHint: "",
    fillTemplate: "本周累计投入巡逻警力{{巡逻警力数}}人次、警车{{巡逻车次}}车次，对{{重点巡逻区域}}开展步巡与车巡相结合的巡防工作，盘查可疑人员{{盘查人数}}人、可疑车辆{{盘查车辆数}}辆，现场抓获现行违法人员{{现场抓获数}}名，辖区可防性案件较上周{{升降幅情况}}。",
    wordCountMin: 150, wordCountMax: 400, order: 3,
  },
  {
    id: uid(), title: "（二）社区警务", fixedTitle: true, required: true,
    level: 2, parentId: weeklyPolicePatrolId, writingMode: "fill", generationHint: "",
    fillTemplate: "社区民警本周走访辖区群众{{走访户数}}户、行业场所{{检查场所数}}家，排查化解矛盾纠纷{{化解纠纷数}}起，开展防范宣传{{宣传活动场次}}场次，覆盖群众{{宣传覆盖人数}}人；落实对{{重点管控对象类别}}的动态管控，辖区{{管控情况}}稳定可控。",
    wordCountMin: 150, wordCountMax: 400, order: 4,
  },
  {
    id: uid(), title: "四、户籍窗口服务", fixedTitle: true, required: false,
    writingMode: "fill", generationHint: "",
    fillTemplate: "本周户籍窗口受理户籍业务{{户籍业务件数}}件、身份证办理{{身份证件数}}件，接待群众咨询{{咨询人次}}人次，发放证件{{发证数}}件，群众满意度{{满意度}}，未发生有效投诉。",
    wordCountMin: 80, wordCountMax: 250, order: 5,
  },
  {
    id: uid(), title: "五、存在不足", fixedTitle: true, required: false,
    generationHint: "以派出所自查视角分析本周警务工作中存在的薄弱环节和不足，如接处警响应、案件办理质效、巡防覆盖面、队伍管理等方面，简述原因。",
    wordCountMin: 100, wordCountMax: 300, order: 6,
  },
  {
    id: uid(), title: "六、下周工作安排", fixedTitle: true, required: true,
    writingMode: "fill", generationHint: "",
    fillTemplate: "下周我所重点抓好以下工作：一是{{工作重点一}}；二是{{工作重点二}}；三是{{工作重点三}}。由{{责任警务区或民警}}牵头，于{{时限要求}}前落实到位，并及时向所领导报告进展。",
    wordCountMin: 150, wordCountMax: 400, order: 7,
  },
]

const rawPresetTemplates: RawTemplate[] = [
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
  {
    id: "preset-weekly-police-summary",
    name: "每周警务工作总结",
    source: "custom",
    sections: weeklyPoliceSummarySections,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const presetTemplates: WritingTemplate[] = rawPresetTemplates.map((t) => ({
  ...t,
  sections: t.sections.map(def),
}))

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
      ].map(def),
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
      ].map(def),
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
      ].map(def),
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
    ].map(def),
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
    // 先放代码版预设为基底,再用 localStorage 的项覆盖(含 preset- —— 后台修改的预设
    // 会覆盖代码版);非预设自定义项也覆盖。这样系统后台对预设的修改能生效。
    const map = new Map<string, WritingTemplate>()
    for (const t of presetTemplates) map.set(t.id, t)
    for (const t of userSaved) {
      map.set(t.id, { ...t, sections: t.sections.map(normalizeSection) })
    }
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
        level: 1, parentId: null, writingMode: "prompt",
        generationHint: "", fillTemplate: "", referenceFiles: [],
        wordCountMin: null, wordCountMax: null, order: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
