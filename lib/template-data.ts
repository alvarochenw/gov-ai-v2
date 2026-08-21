/**
 * Module-level store for passing template writing input data from the config page
 * to the chat page. Follows the same pattern as proofread-data.ts.
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
}

let pendingInput: TemplateWritingInput | null = null
let consumed = true

export function setTemplateWritingInput(input: TemplateWritingInput) {
  pendingInput = input
  consumed = false
}

export function consumeTemplateWritingInput(): TemplateWritingInput | null {
  if (consumed) return null
  consumed = true
  const value = pendingInput
  pendingInput = null
  return value
}
