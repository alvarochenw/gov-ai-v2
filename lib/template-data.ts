/**
 * Types for the template-writing flow. TemplateWriteView holds the input in
 * component state across its three internal steps (config → 参考文档 → 生成),
 * so no module-level stash is needed.
 */

import type { TemplateSection } from "@/data/template"

export interface ReferenceFile {
  source: "local" | "knowledge"
  name: string
}

export interface TemplateWritingInput {
  templateName: string
  sections: TemplateSection[]
  referenceFiles: ReferenceFile[]
  totalWordCountMin: number | null
  totalWordCountMax: number | null
  additionalNotes: string        // 写作要求(全局提示词)
  documentTitle: string          // 公文标题
  draftingUnit: string           // 拟稿单位(选填)
  placeholderValues?: Record<string, string>  // fill 模式占位符取值(用户在配置页填写)
}
