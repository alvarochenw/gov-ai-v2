export interface TypesetTemplate {
  id: string
  name: string
  description: string
}

export const typesetTemplates: TypesetTemplate[] = [
  {
    id: "gb9702",
    name: "党政机关公文格式",
    description: "GB/T 9702",
  },
  {
    id: "notice-compact",
    name: "通知类公文紧凑版式",
    description: "适合短通知、工作提醒、会议安排",
  },
  {
    id: "report-formal",
    name: "报告请示正式版式",
    description: "适合请示、报告、方案等长文稿",
  },
  {
    id: "minutes",
    name: "会议纪要版式",
    description: "适合纪要、议定事项、任务清单",
  },
]

export interface RedHeadTemplate {
  id: string
  name: string
}

export const redHeadTemplates: RedHeadTemplate[] = [
  { id: "red-1", name: "套红模板1" },
  { id: "red-2", name: "套红模板2" },
  { id: "red-3", name: "套红模板3" },
  { id: "red-4", name: "套红模板4" },
]
