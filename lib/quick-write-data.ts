/**
 * Module-level store for passing quick-write (生成全文) input data from the
 * wizard to the chat page. Same pattern as template-data.ts / pending-prompt.ts.
 *
 * Unlike TemplateWritingInput, this carries no placeholderValues — the wizard
 * does not collect placeholder values, so fill-mode sections keep their fixed
 * text and unresolved placeholders render as 【待补:字段名】 at generation time.
 * The global prompt (additionalNotes) therefore never enters fill-mode text;
 * it only layers onto prompt-mode sections. See docs/模板库AI功能实现逻辑.md §7.2/§7.8.
 */

import type { TemplateSection } from "@/data/template"
import type { ReferenceFile } from "@/lib/template-data"

export interface QuickWriteInput {
  templateName: string
  sections: TemplateSection[]
  referenceFiles: ReferenceFile[]
  totalWordCountMin: number | null
  totalWordCountMax: number | null
  additionalNotes: string        // 全局提示词(用户在向导填写)
  documentTitle: string          // 公文标题
  draftingUnit: string           // 拟稿单位(选填)
  sceneName?: string             // 选场景分支时携带(本次不深度使用)
}

let pendingInput: QuickWriteInput | null = null
let consumed = true

export function setQuickWriteInput(input: QuickWriteInput): void {
  pendingInput = input
  consumed = false
}

export function consumeQuickWriteInput(): QuickWriteInput | null {
  if (consumed) return null
  consumed = true
  const value = pendingInput
  pendingInput = null
  return value
}
