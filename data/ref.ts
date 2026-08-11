/**
 * Ref-write data: types, writing mode options, mock extraction,
 * and localStorage helpers for quick schemes.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface RefMaterial {
  id: string
  source: "local" | "knowledge" | "paste"
  name: string              // file name or "粘贴文本(N字)"
  pasteContent?: string     // only for paste source
}

export type WritingMode = "仿写" | "改写" | "续写" | "扩写"

export interface WritingModeOption {
  mode: WritingMode
  label: string
  description: string
}

export interface RefOverview {
  structureItems: string[]
  keyExpressions: string[]
}

/* ------------------------------------------------------------------ */
/*  Writing mode options                                              */
/* ------------------------------------------------------------------ */

export const writingModeOptions: WritingModeOption[] = [
  { mode: "仿写", label: "同结构同风格仿写", description: "参考原文的结构和表达风格，撰写同类主题的新文稿" },
  { mode: "改写", label: "调整格式或语气", description: "保留原文核心内容，调整文种格式、语气或表达方式" },
  { mode: "续写", label: "延续后续内容", description: "在原文基础上，延续结构和风格补充后续内容" },
  { mode: "扩写", label: "展开充实细节", description: "在原文框架基础上，展开论述、充实细节和论证" },
]

/* ------------------------------------------------------------------ */
/*  Mock extraction (multi-material)                                  */
/* ------------------------------------------------------------------ */

const uid = () => crypto.randomUUID()

export async function mockExtractRefOverview(
  materials: RefMaterial[]
): Promise<RefOverview> {
  await new Promise((resolve) => setTimeout(resolve, 1200))

  // Collect all file names and paste texts
  const fileNames = materials.filter((m) => m.source !== "paste").map((m) => m.name)
  const pasteTexts = materials.filter((m) => m.source === "paste" && m.pasteContent).map((m) => m.pasteContent!)

  // Build merged overview from all materials
  const allStructures: string[] = []
  const allExpressions: string[] = []

  for (const name of fileNames) {
    const overview = getOverviewForFileName(name)
    allStructures.push(...overview.structureItems)
    allExpressions.push(...overview.keyExpressions)
  }

  for (const text of pasteTexts) {
    allStructures.push("一、背景概述", "二、核心内容", "三、相关要求")
    allExpressions.push(...extractMockExpressions(text))
  }

  if (allStructures.length === 0) {
    allStructures.push("一、背景概述", "二、核心内容", "三、相关要求", "四、落款")
    allExpressions.push("根据…要求", "现就有关事项说明如下", "请予支持配合", "特此函达")
  }

  // Deduplicate
  const uniqueStructures = [...new Set(allStructures)]
  const uniqueExpressions = [...new Set(allExpressions)]

  return {
    structureItems: uniqueStructures,
    keyExpressions: uniqueExpressions,
  }
}

function getOverviewForFileName(fileName: string): RefOverview {
  const lower = fileName.toLowerCase()

  if (lower.includes("通知") || lower.includes("公告") || lower.includes("通告")) {
    return {
      structureItems: ["一、发文缘由", "二、通知事项", "三、工作要求", "四、落款"],
      keyExpressions: ["根据…精神", "现就有关事项通知如下", "请认真贯彻执行", "特此通知"],
    }
  }

  if (lower.includes("总结") || lower.includes("报告")) {
    return {
      structureItems: ["一、基本情况", "二、主要工作", "三、成效亮点", "四、存在问题", "五、下步计划"],
      keyExpressions: ["稳步推进", "持续向好", "成效显著", "扎实推进", "取得积极进展"],
    }
  }

  if (lower.includes("讲话") || lower.includes("发言")) {
    return {
      structureItems: ["一、充分肯定成绩", "二、深刻认识形势", "三、明确重点任务", "四、加强组织保障"],
      keyExpressions: ["同志们", "坚定不移", "凝心聚力", "真抓实干", "奋力开创"],
    }
  }

  if (lower.includes("请示") || lower.includes("批复")) {
    return {
      structureItems: ["一、请示缘由", "二、请示事项", "三、请求批示"],
      keyExpressions: ["鉴于…", "现请示如下", "妥否，请批示"],
    }
  }

  return {
    structureItems: ["一、背景概述", "二、核心内容", "三、相关要求", "四、落款"],
    keyExpressions: ["根据…要求", "现就有关事项说明如下", "请予支持配合", "特此函达"],
  }
}

function extractMockExpressions(text: string): string[] {
  const segments = text
    .replace(/\s+/g, "")
    .split(/[，。；：！？、\n\r]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 8)

  if (segments.length <= 4) return segments.slice(0, 4)

  const count = Math.min(5, segments.length)
  const step = Math.floor(segments.length / count)
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(segments[i * step])
  }
  return result
}
